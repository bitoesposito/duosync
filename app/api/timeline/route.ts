/**
 * Timeline API Endpoint
 * 
 * GET /api/timeline?date=YYYY-MM-DD&userIds=1,2,3
 * 
 * Calculates timeline for a specific date and users
 */

import { NextRequest, NextResponse } from "next/server"
import { findUserByToken } from "@/lib/services/auth.service"
import { calculateTimeline } from "@/lib/services/timeline.service"
import { timelineQuerySchema } from "@/lib/utils/validation"
import { checkRateLimit, getRateLimitHeaders } from "@/lib/utils/rate-limit"
import { logger } from "@/lib/utils/logger"
import { getUserFriendlyError } from "@/lib/utils/api-error"

const TIMELINE_TIMEOUT_MS = 5000 // 5 seconds

export async function GET(request: NextRequest) {
	const startTime = performance.now()

	try {
		// Check authentication
		const token = request.cookies.get("auth_token")?.value
		if (!token) {
			return NextResponse.json(
				{
					error: {
						code: "UNAUTHORIZED",
						message: "Authentication required",
					},
				},
				{ status: 401 }
			)
		}

		const user = await findUserByToken(token)
		if (!user) {
			return NextResponse.json(
				{
					error: {
						code: "UNAUTHORIZED",
						message: "Invalid authentication token",
					},
				},
				{ status: 401 }
			)
		}

		// Rate limiting (more restrictive for timeline endpoint)
		const identifier = user.id.toString()
		const rateLimitResult = await checkRateLimit(identifier, {
			requests: 20,
			window: "1 m",
		})

		if (!rateLimitResult.success) {
			return NextResponse.json(
				{
					error: {
						code: "RATE_LIMIT_EXCEEDED",
						message: "Too many requests. Please wait a moment and try again.",
					},
				},
				{
					status: 429,
					headers: getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.reset),
				}
			)
		}

		// Parse and validate query parameters
		const { searchParams } = new URL(request.url)
		const date = searchParams.get("date")
		const userIdsParam = searchParams.get("userIds")

		if (!date || !userIdsParam) {
			return NextResponse.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Missing required parameters: date and userIds",
					},
				},
				{ status: 400 }
			)
		}

		// Validate with Zod
		const validationResult = timelineQuerySchema.safeParse({
			date,
			userIds: userIdsParam,
		})

		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: validationResult.error.issues[0].message,
					},
				},
				{ status: 400 }
			)
		}

		const { date: validatedDate, userIds } = validationResult.data

		// Get user timezone from user record (default to UTC)
		const userTimezone = user.timezone || "UTC"

		// Calculate timeline with timeout
		const timelinePromise = calculateTimeline(validatedDate, userIds, userTimezone)
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error("Timeline calculation timeout")), TIMELINE_TIMEOUT_MS)
		})

		let segments
		try {
			segments = await Promise.race([timelinePromise, timeoutPromise])
		} catch (error) {
			if (error instanceof Error && error.message === "Timeline calculation timeout") {
				logger.warn({ date: validatedDate, userIds, duration: performance.now() - startTime }, "Timeline timeout")
				return NextResponse.json(
					{
						error: {
							code: "TIMELINE_TIMEOUT",
							message: "Timeline calculation timeout",
						},
					},
					{ status: 504 }
				)
			}
			throw error
		}

		const duration = performance.now() - startTime
		logger.info({ date: validatedDate, userIds, segmentsCount: segments.length, duration }, "Timeline request completed")

		return NextResponse.json(segments, {
			headers: {
				...getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.reset),
				"Content-Type": "application/json",
			},
		})
	} catch (error) {
		logger.error({ error }, "Timeline calculation error")

		// Database errors → 500 with generic message
		if (error instanceof Error && error.message.includes("database") || error instanceof Error && error.message.includes("connection")) {
			return NextResponse.json(
				{
					error: {
						code: "INTERNAL_ERROR",
						message: "An internal error occurred. Please try again later.",
					},
				},
				{ status: 500 }
			)
		}

		// Other errors → 500 with generic message
		return NextResponse.json(
			{
				error: {
					code: "INTERNAL_ERROR",
					message: getUserFriendlyError(error instanceof Error ? error : new Error(String(error))),
				},
			},
			{ status: 500 }
		)
	}
}

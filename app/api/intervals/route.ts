/**
 * Intervals API Endpoint
 * 
 * GET /api/intervals?date=YYYY-MM-DD
 * POST /api/intervals
 */

import { NextRequest, NextResponse } from "next/server"
import { findUserByToken } from "@/lib/services/auth.service"
import { getIntervalsByDate, createInterval } from "@/lib/services/intervals.service"
import { intervalSchema, timelineQuerySchema } from "@/lib/utils/validation"
import { checkRateLimit, getRateLimitHeaders } from "@/lib/utils/rate-limit"
import { logger } from "@/lib/utils/logger"
import { getUserFriendlyError } from "@/lib/utils/api-error"
import dayjs from "@/lib/time/dayjs"

/**
 * GET /api/intervals?date=YYYY-MM-DD
 * Get intervals for a specific date
 */
export async function GET(request: NextRequest) {
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

		// Rate limiting
		const identifier = user.id.toString()
		const rateLimitResult = await checkRateLimit(identifier)

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
		const dateParam = searchParams.get("date")

		if (!dateParam) {
			return NextResponse.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Missing required parameter: date",
					},
				},
				{ status: 400 }
			)
		}

		// Validate date format
		const dateValidation = timelineQuerySchema.pick({ date: true }).safeParse({ date: dateParam })
		if (!dateValidation.success) {
			return NextResponse.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid date format. Use YYYY-MM-DD",
					},
				},
				{ status: 400 }
			)
		}

		const date = dayjs.utc(dateValidation.data.date).toDate()
		const intervals = await getIntervalsByDate(user.id, date)

		return NextResponse.json(intervals, {
			headers: getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.reset),
		})
	} catch (error) {
		logger.error({ error }, "Get intervals error")

		if (error instanceof Error && (error.message.includes("database") || error.message.includes("connection"))) {
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

/**
 * POST /api/intervals
 * Create a new interval
 */
export async function POST(request: NextRequest) {
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

		// Rate limiting
		const identifier = user.id.toString()
		const rateLimitResult = await checkRateLimit(identifier)

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

		// Parse and validate request body
		const body = await request.json()
		const validationResult = intervalSchema.safeParse(body)

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

		const data = validationResult.data

		// Create interval
		const interval = await createInterval({
			userId: user.id,
			startTs: new Date(data.start_ts),
			endTs: new Date(data.end_ts),
			category: data.category,
			description: data.description || null,
			recurrenceRule: data.recurrence_rule || null,
		})

		return NextResponse.json(interval, {
			status: 201,
			headers: getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.reset),
		})
	} catch (error) {
		logger.error({ error }, "Create interval error")

		if (error instanceof Error && (error.message.includes("database") || error.message.includes("connection"))) {
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

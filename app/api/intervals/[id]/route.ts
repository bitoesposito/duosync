/**
 * Interval API Endpoint (by ID)
 * 
 * GET /api/intervals/:id
 * PUT /api/intervals/:id
 * DELETE /api/intervals/:id
 */

import { NextRequest, NextResponse } from "next/server"
import { findUserByToken } from "@/lib/services/auth.service"
import { getIntervalById, updateInterval, deleteInterval } from "@/lib/services/intervals.service"
import { intervalSchema } from "@/lib/utils/validation"
import { checkRateLimit, getRateLimitHeaders } from "@/lib/utils/rate-limit"
import { logger } from "@/lib/utils/logger"
import { getUserFriendlyError } from "@/lib/utils/api-error"

/**
 * GET /api/intervals/:id
 * Get interval by ID
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		const intervalId = parseInt(id, 10)

		if (isNaN(intervalId)) {
			return NextResponse.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid interval ID",
					},
				},
				{ status: 400 }
			)
		}

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

		const interval = await getIntervalById(intervalId, user.id)

		if (!interval) {
			return NextResponse.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "Interval not found",
					},
				},
				{ status: 404 }
			)
		}

		return NextResponse.json(interval, {
			headers: getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.reset),
		})
	} catch (error) {
		logger.error({ error }, "Get interval error")

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
 * PUT /api/intervals/:id
 * Update interval
 */
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		const intervalId = parseInt(id, 10)

		if (isNaN(intervalId)) {
			return NextResponse.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid interval ID",
					},
				},
				{ status: 400 }
			)
		}

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
		const validationResult = intervalSchema.partial().safeParse(body)

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

		// Update interval
		const updated = await updateInterval(
			intervalId,
			user.id,
			{
				...(data.start_ts && { startTs: new Date(data.start_ts) }),
				...(data.end_ts && { endTs: new Date(data.end_ts) }),
				...(data.category && { category: data.category }),
				...(data.description !== undefined && { description: data.description }),
				...(data.recurrence_rule !== undefined && { recurrenceRule: data.recurrence_rule }),
			}
		)

		if (!updated) {
			return NextResponse.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "Interval not found",
					},
				},
				{ status: 404 }
			)
		}

		return NextResponse.json(updated, {
			headers: getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.reset),
		})
	} catch (error) {
		logger.error({ error }, "Update interval error")

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
 * DELETE /api/intervals/:id
 * Delete interval
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		const intervalId = parseInt(id, 10)

		if (isNaN(intervalId)) {
			return NextResponse.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid interval ID",
					},
				},
				{ status: 400 }
			)
		}

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

		const deleted = await deleteInterval(intervalId, user.id)

		if (!deleted) {
			return NextResponse.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "Interval not found",
					},
				},
				{ status: 404 }
			)
		}

		return new NextResponse(null, {
			status: 204,
			headers: getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.reset),
		})
	} catch (error) {
		logger.error({ error }, "Delete interval error")

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

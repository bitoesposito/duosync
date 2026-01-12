/**
 * Intervals Service
 * 
 * Business logic for interval CRUD operations
 */

import { db, busyIntervals } from "@/lib/db"
import { eq, and, gte, lte } from "drizzle-orm"
import { intervalSchema } from "@/lib/utils/validation"
import { logger } from "@/lib/utils/logger"
import type { Interval } from "@/types"

/**
 * Create a new interval
 */
export async function createInterval(data: {
	userId: number
	startTs: Date
	endTs: Date
	category: "sleep" | "busy" | "other"
	description?: string | null
	recurrenceRule?: any
}) {
	logger.debug({ userId: data.userId, category: data.category }, "Creating interval")

	const [interval] = await db
		.insert(busyIntervals)
		.values({
			userId: data.userId,
			startTs: data.startTs,
			endTs: data.endTs,
			category: data.category,
			description: data.description || null,
			recurrenceRule: data.recurrenceRule || null,
		})
		.returning()

	logger.info({ intervalId: interval.id, userId: data.userId }, "Interval created")

	return interval
}

/**
 * Get intervals for a specific date
 */
export async function getIntervalsByDate(userId: number, date: Date) {
	const dayStart = new Date(date)
	dayStart.setUTCHours(0, 0, 0, 0)
	const dayEnd = new Date(date)
	dayEnd.setUTCHours(23, 59, 59, 999)

	logger.debug({ userId, dayStart, dayEnd }, "Fetching intervals by date")

	const intervals = await db
		.select()
		.from(busyIntervals)
		.where(
			and(
				eq(busyIntervals.userId, userId),
				gte(busyIntervals.startTs, dayStart),
				lte(busyIntervals.endTs, dayEnd)
			)
		)

	return intervals
}

/**
 * Get interval by ID
 */
export async function getIntervalById(id: number, userId: number) {
	const interval = await db.query.busyIntervals.findFirst({
		where: and(eq(busyIntervals.id, id), eq(busyIntervals.userId, userId)),
	})

	if (!interval) {
		return null
	}

	return interval
}

/**
 * Update interval
 */
export async function updateInterval(
	id: number,
	userId: number,
	data: {
		startTs?: Date
		endTs?: Date
		category?: "sleep" | "busy" | "other"
		description?: string | null
		recurrenceRule?: any
	}
) {
	logger.debug({ intervalId: id, userId }, "Updating interval")

	// Verify ownership
	const existing = await getIntervalById(id, userId)
	if (!existing) {
		return null
	}

	const [updated] = await db
		.update(busyIntervals)
		.set({
			...(data.startTs && { startTs: data.startTs }),
			...(data.endTs && { endTs: data.endTs }),
			...(data.category && { category: data.category }),
			...(data.description !== undefined && { description: data.description }),
			...(data.recurrenceRule !== undefined && { recurrenceRule: data.recurrenceRule }),
			updatedAt: new Date(),
		})
		.where(and(eq(busyIntervals.id, id), eq(busyIntervals.userId, userId)))
		.returning()

	logger.info({ intervalId: id, userId }, "Interval updated")

	return updated
}

/**
 * Delete interval
 */
export async function deleteInterval(id: number, userId: number) {
	logger.debug({ intervalId: id, userId }, "Deleting interval")

	// Verify ownership
	const existing = await getIntervalById(id, userId)
	if (!existing) {
		return false
	}

	await db
		.delete(busyIntervals)
		.where(and(eq(busyIntervals.id, id), eq(busyIntervals.userId, userId)))

	logger.info({ intervalId: id, userId }, "Interval deleted")

	return true
}

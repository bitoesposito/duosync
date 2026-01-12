/**
 * Timeline Service
 * 
 * Business logic for timeline calculation
 * Orchestrates algorithms from lib/algorithms/
 */

import { db, busyIntervals } from "@/lib/db"
import { and, inArray, lt, gt } from "drizzle-orm"
import { mergeIntervals } from "@/lib/algorithms/merge.service"
import { resolveRecurrences } from "@/lib/algorithms/recurrence.service"
import { calculateFreeSlots } from "@/lib/algorithms/complement.service"
import dayjs from "@/lib/time/dayjs"
import type { Interval, TimelineSegment } from "@/types"
import { logger } from "@/lib/utils/logger"

/**
 * Calculate timeline for a specific date and users
 * 
 * @param date - Date string in YYYY-MM-DD format (UTC)
 * @param userIds - Array of user IDs
 * @param userTimezone - Timezone of the requesting user (for output conversion)
 * @returns Array of timeline segments ready for rendering
 */
export async function calculateTimeline(
	date: string,
	userIds: number[],
	userTimezone: string = "UTC"
): Promise<TimelineSegment[]> {
	const startTime = performance.now()

	// Parse date and create day range in UTC
	const dayStart = dayjs.utc(date).startOf("day").toDate()
	const dayEnd = dayjs.utc(date).endOf("day").toDate()

	logger.debug({ date, userIds, dayStart, dayEnd }, "Calculating timeline")

	// Step 1: Query intervals from database (range-based query)
	const rawIntervals = await db
		.select({
			id: busyIntervals.id,
			userId: busyIntervals.userId,
			startTs: busyIntervals.startTs,
			endTs: busyIntervals.endTs,
			category: busyIntervals.category,
			description: busyIntervals.description,
			recurrenceRule: busyIntervals.recurrenceRule,
		})
		.from(busyIntervals)
		.where(
			and(
				inArray(busyIntervals.userId, userIds),
				lt(busyIntervals.startTs, dayEnd),
				gt(busyIntervals.endTs, dayStart)
			)
		)

	logger.debug({ count: rawIntervals.length }, "Fetched intervals from DB")

	// Step 2: Normalize intervals (clamp to day range)
	const normalizedIntervals: Interval[] = rawIntervals.map((interval) => ({
		id: interval.id,
		userId: interval.userId,
		startTs: new Date(Math.max(interval.startTs.getTime(), dayStart.getTime())),
		endTs: new Date(Math.min(interval.endTs.getTime(), dayEnd.getTime())),
		category: interval.category,
		description: interval.description,
		recurrenceRule: interval.recurrenceRule as any,
		createdAt: new Date(),
		updatedAt: new Date(),
	}))

	// Step 3: Resolve recurrences
	const resolvedIntervals = resolveRecurrences(normalizedIntervals, dayStart, dayEnd)

	logger.debug({ count: resolvedIntervals.length }, "Resolved recurrences")

	// Step 4: Merge intervals with priority
	const merged = mergeIntervals(resolvedIntervals)

	logger.debug({ count: merged.length }, "Merged intervals")

	// Step 5: Calculate free slots (complement)
	const freeSlots = calculateFreeSlots(merged, dayStart, dayEnd)

	// Step 6: Combine busy intervals and free slots, then convert to timeline segments
	const segments: TimelineSegment[] = []

	// Add busy intervals as segments
	for (const interval of merged) {
		// Convert to user timezone and format as HH:mm
		const startLocal = dayjs(interval.start).tz(userTimezone).format("HH:mm")
		const endLocal = dayjs(interval.end).tz(userTimezone).format("HH:mm")

		segments.push({
			start: startLocal,
			end: endLocal,
			category: interval.category,
		})
	}

	// Add free slots as "match" segments
	for (const slot of freeSlots) {
		const startLocal = dayjs(slot.start).tz(userTimezone).format("HH:mm")
		const endLocal = dayjs(slot.end).tz(userTimezone).format("HH:mm")

		segments.push({
			start: startLocal,
			end: endLocal,
			category: "match",
		})
	}

	// Sort segments by start time
	segments.sort((a, b) => {
		const aTime = dayjs(a.start, "HH:mm")
		const bTime = dayjs(b.start, "HH:mm")
		return aTime.isBefore(bTime) ? -1 : aTime.isAfter(bTime) ? 1 : 0
	})

	const duration = performance.now() - startTime
	logger.info({ date, userIds, segmentsCount: segments.length, duration }, "Timeline calculated")

	return segments
}

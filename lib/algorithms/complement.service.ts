/**
 * Complement Algorithm
 * 
 * Pure function to calculate free slots (complement of busy intervals)
 */

import type { MergedInterval } from "./merge.service"

export interface FreeSlot {
	start: Date
	end: Date
}

/**
 * Calculate free slots (complement) from merged intervals
 * 
 * @param mergedIntervals - Array of merged busy intervals
 * @param dayStart - Start of the day (in UTC)
 * @param dayEnd - End of the day (in UTC)
 * @returns Array of free slots
 */
export function calculateFreeSlots(
	mergedIntervals: MergedInterval[],
	dayStart: Date,
	dayEnd: Date
): FreeSlot[] {
	const freeSlots: FreeSlot[] = []
	let cursor = dayStart

	for (const interval of mergedIntervals) {
		if (cursor < interval.start) {
			freeSlots.push({
				start: cursor,
				end: interval.start,
			})
		}
		cursor = new Date(Math.max(cursor.getTime(), interval.end.getTime()))
	}

	// Add remaining free slot if any
	if (cursor < dayEnd) {
		freeSlots.push({
			start: cursor,
			end: dayEnd,
		})
	}

	return freeSlots
}

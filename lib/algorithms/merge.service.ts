/**
 * Merge Intervals Algorithm
 * 
 * Pure function to merge overlapping intervals with priority
 * Priority: sleep > busy > other
 */

import type { Interval } from "@/types"

export interface MergedInterval {
	start: Date
	end: Date
	category: "sleep" | "busy" | "other"
}

/**
 * Merge intervals with priority handling
 * 
 * @param intervals - Array of intervals to merge
 * @returns Array of merged intervals
 */
export function mergeIntervals(intervals: Interval[]): MergedInterval[] {
	if (intervals.length === 0) {
		return []
	}

	// Sort intervals by start time
	const sorted = [...intervals].sort((a, b) => a.startTs.getTime() - b.startTs.getTime())

	const merged: MergedInterval[] = []

	for (const interval of sorted) {
		if (merged.length === 0) {
			merged.push({
				start: interval.startTs,
				end: interval.endTs,
				category: interval.category,
			})
			continue
		}

		const last = merged[merged.length - 1]

		if (interval.startTs <= last.end) {
			// Overlap: merge with priority
			last.end = new Date(Math.max(last.end.getTime(), interval.endTs.getTime()))
			last.category = maxPriority(last.category, interval.category)
		} else {
			// No overlap: new interval
			merged.push({
				start: interval.startTs,
				end: interval.endTs,
				category: interval.category,
			})
		}
	}

	return merged
}

/**
 * Get category with higher priority
 * Priority: sleep > busy > other
 */
function maxPriority(
	a: "sleep" | "busy" | "other",
	b: "sleep" | "busy" | "other"
): "sleep" | "busy" | "other" {
	const priority = { sleep: 3, busy: 2, other: 1 }
	return priority[a] > priority[b] ? a : b
}

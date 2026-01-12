/**
 * Recurrence Resolution Algorithm
 * 
 * Pure function to resolve recurrence rules into specific intervals
 * Uses rrule library for recurrence calculation
 */

import { RRule, Frequency } from "rrule"
import type { Interval, RecurrenceRule } from "@/types"

/**
 * Resolve recurrence rules into specific intervals for a given date range
 * 
 * @param intervals - Array of intervals (some may have recurrence rules)
 * @param dayStart - Start of the day range (in UTC)
 * @param dayEnd - End of the day range (in UTC)
 * @returns Array of resolved intervals (recurrences expanded, non-recurring unchanged)
 */
export function resolveRecurrences(
	intervals: Interval[],
	dayStart: Date,
	dayEnd: Date
): Interval[] {
	const resolved: Interval[] = []

	for (const interval of intervals) {
		if (!interval.recurrenceRule) {
			// Single interval, add directly
			resolved.push(interval)
			continue
		}

		// Resolve recurrence
		const occurrences = resolveRecurrenceRule(
			interval,
			interval.recurrenceRule,
			dayStart,
			dayEnd
		)

		resolved.push(...occurrences)
	}

	return resolved
}

/**
 * Resolve a single recurrence rule into occurrences
 */
function resolveRecurrenceRule(
	baseInterval: Interval,
	rule: RecurrenceRule,
	dayStart: Date,
	dayEnd: Date
): Interval[] {
	const occurrences: Interval[] = []

	// Map type to RRule frequency
	const frequencyMap: Record<string, Frequency> = {
		daily: RRule.DAILY,
		weekly: RRule.WEEKLY,
		monthly: RRule.MONTHLY,
	}

	// Build RRule options
	const rruleOptions: Partial<RRule.Options> = {
		freq: frequencyMap[rule.type],
		dtstart: baseInterval.startTs,
		until: rule.until ? new Date(rule.until) : undefined,
	}

	// Map days of week (1-7 to 0-6 for RRule)
	const daysOfWeek = rule.daysOfWeek.map((d) => d - 1)

	if (rule.type === "weekly") {
		rruleOptions.byweekday = daysOfWeek
	} else if (rule.type === "daily") {
		// Daily with selected days: filter by weekday
		rruleOptions.byweekday = daysOfWeek
		rruleOptions.freq = RRule.DAILY
	} else if (rule.type === "monthly") {
		// Monthly: combine dayOfMonth/byWeekday with daysOfWeek
		if (rule.dayOfMonth !== undefined) {
			if (rule.dayOfMonth === -1 || rule.dayOfMonth === "last") {
				rruleOptions.bymonthday = [-1]
			} else {
				rruleOptions.bymonthday = [rule.dayOfMonth]
			}
			// Filter by weekday if specified
			if (daysOfWeek.length > 0) {
				rruleOptions.byweekday = daysOfWeek
			}
		} else if (rule.byWeekday) {
			// Parse "first-monday", "last-friday", etc.
			const [position, weekday] = parseByWeekday(rule.byWeekday)
			rruleOptions.byweekday = [{ weekday, n: position }]
			// If daysOfWeek specified, must match
			if (daysOfWeek.length > 0 && daysOfWeek.includes(weekday)) {
				rruleOptions.byweekday = [{ weekday, n: position }]
			}
		}
	}

	// Create RRule and generate occurrences
	const rrule = new RRule(rruleOptions)
	const occurrenceDates = rrule.between(dayStart, dayEnd, true)

	// Create intervals for each occurrence
	const duration = baseInterval.endTs.getTime() - baseInterval.startTs.getTime()

	for (const occurrence of occurrenceDates) {
		occurrences.push({
			...baseInterval,
			startTs: occurrence,
			endTs: new Date(occurrence.getTime() + duration),
			recurrenceRule: undefined, // No longer recurring, it's an instance
		})
	}

	return occurrences
}

/**
 * Parse "first-monday", "last-friday", etc. into RRule format
 */
function parseByWeekday(byWeekday: string): [number, number] {
	const [position, weekday] = byWeekday.split("-")
	const positionMap: Record<string, number> = {
		first: 1,
		second: 2,
		third: 3,
		fourth: 4,
		last: -1,
	}
	const weekdayMap: Record<string, number> = {
		monday: 0,
		tuesday: 1,
		wednesday: 2,
		thursday: 3,
		friday: 4,
		saturday: 5,
		sunday: 6,
	}
	return [positionMap[position.toLowerCase()], weekdayMap[weekday.toLowerCase()]]
}

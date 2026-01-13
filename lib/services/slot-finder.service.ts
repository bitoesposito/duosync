/**
 * Slot finder utilities - finds available time slots between intervals.
 * Adapted for the new Interval type (using Date objects).
 */

import dayjs, { parseTimeStrict, TWENTY_FOUR_HOUR_FORMAT } from "@/lib/time/dayjs"
import { Interval } from "@/types"
import { UTCtoLocal } from "@/lib/utils/timezone"

/**
 * Finds the first available time slot in the day, starting from 00:00 or current time.
 * @param existingIntervals - Array of existing intervals
 * @param dateStr - The reference date (YYYY-MM-DD) for local time conversion
 * @param timezone - User's timezone
 * @param fromTime - Optional time to start searching from (defaults to "00:00")
 * @returns First available time slot in HH:mm format, or null if no slots available
 */
export function findFirstAvailableSlot(
    existingIntervals: Interval[],
    dateStr: string,
    timezone: string,
    fromTime: string = "00:00"
): string | null {
    const startTime = parseTimeStrict(fromTime)
    if (!startTime.isValid()) {
        return null
    }

    // 1. Map intervals to simple start/end HH:mm strings for the selected date
    // We only care about intervals that intersect with the selected date [00:00, 23:59]
    const dateStart = dayjs(dateStr).startOf("day")
    const dateEnd = dayjs(dateStr).endOf("day")

    const mappedIntervals = existingIntervals
        .map((interval) => {
            const startLocal = dayjs(UTCtoLocal(interval.startTs, timezone))
            const endLocal = dayjs(UTCtoLocal(interval.endTs, timezone))

            // Check overlaps
            if (endLocal.isBefore(dateStart) || startLocal.isAfter(dateEnd)) {
                return null
            }

            // Clamp to day boundaries
            const effectiveStart = startLocal.isBefore(dateStart) ? "00:00" : startLocal.format(TWENTY_FOUR_HOUR_FORMAT)
            const effectiveEnd = endLocal.isAfter(dateEnd) ? "23:59" : endLocal.format(TWENTY_FOUR_HOUR_FORMAT)

            // Special case: if it ends at 00:00 of next day, it's 24:00 (effectively 23:59 for slot finding purposes, 
            // or we treat 00:00 next day as blocking until end of day)
            // For simplicity: if endLocal is next day 00:00, it covers until "24:00". 
            // But our loop compares strings. "23:59" is safe max.

            return {
                startTime: effectiveStart,
                endTime: effectiveEnd
            }
        })
        .filter((i): i is { startTime: string; endTime: string } => i !== null)
        .sort((a, b) => {
            const aStart = parseTimeStrict(a.startTime)
            const bStart = parseTimeStrict(b.startTime)
            return aStart.diff(bStart)
        })

    let currentTime = startTime

    // Find the first gap
    for (const interval of mappedIntervals) {
        const intervalStart = parseTimeStrict(interval.startTime)
        const intervalEnd = parseTimeStrict(interval.endTime)

        if (!intervalStart.isValid() || !intervalEnd.isValid()) {
            continue
        }

        // If current time is before this interval, we found a gap
        if (currentTime.isBefore(intervalStart)) {
            return currentTime.format(TWENTY_FOUR_HOUR_FORMAT)
        }

        // Move current time to after this interval
        if (currentTime.isBefore(intervalEnd) || currentTime.isSame(intervalEnd)) {
            currentTime = intervalEnd
        }
    }

    // Check if there's time left until end of day
    const dayEnd = dayjs("23:59", TWENTY_FOUR_HOUR_FORMAT)
    if (currentTime.isBefore(dayEnd)) {
        return currentTime.format(TWENTY_FOUR_HOUR_FORMAT)
    }

    return null
}

/**
 * Checks if a start time is within an existing interval.
 */
export function isStartTimeWithinInterval(
    startTime: string,
    existingIntervals: Interval[],
    dateStr: string,
    timezone: string
): boolean {
    if (!startTime) return false

    const start = parseTimeStrict(startTime)
    if (!start.isValid()) return false

    const dateStart = dayjs(dateStr).startOf("day")
    const dateEnd = dayjs(dateStr).endOf("day")

    return existingIntervals.some((interval) => {
        const startLocal = dayjs(UTCtoLocal(interval.startTs, timezone))
        const endLocal = dayjs(UTCtoLocal(interval.endTs, timezone))

        // Check overlaps with day
        if (endLocal.isBefore(dateStart) || startLocal.isAfter(dateEnd)) {
            return false
        }

        // Clamp
        const effectiveStartStr = startLocal.isBefore(dateStart) ? "00:00" : startLocal.format(TWENTY_FOUR_HOUR_FORMAT)
        const effectiveEndStr = endLocal.isAfter(dateEnd) ? "23:59" : endLocal.format(TWENTY_FOUR_HOUR_FORMAT)

        const appointmentStart = parseTimeStrict(effectiveStartStr)
        const appointmentEnd = parseTimeStrict(effectiveEndStr)

        // Check if start time is within this interval
        return start.isAfter(appointmentStart) && start.isBefore(appointmentEnd)
    })
}

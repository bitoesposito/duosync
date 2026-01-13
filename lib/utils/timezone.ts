/**
 * Timezone Utilities
 * 
 * Functions for timezone conversion and formatting
 * All calculations are done in UTC, conversion only for display
 */

import dayjs from "@/lib/time/dayjs"

/**
 * Convert UTC timestamp to user timezone and format as HH:mm
 * 
 * @param timestamp - UTC timestamp (Date or ISO string)
 * @param timezone - User timezone (e.g., "Europe/Rome", "America/New_York")
 * @returns Formatted time string (HH:mm)
 */
export function formatTimeInTimezone(
	timestamp: Date | string,
	timezone: string = "UTC"
): string {
	return dayjs(timestamp).tz(timezone).format("HH:mm")
}

/**
 * Convert UTC date to user timezone and format as YYYY-MM-DD
 * 
 * @param date - UTC date (Date or ISO string)
 * @param timezone - User timezone
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatDateInTimezone(
	date: Date | string,
	timezone: string = "UTC"
): string {
	return dayjs(date).tz(timezone).format("YYYY-MM-DD")
}

/**
 * Convert local time (HH:mm) and date (YYYY-MM-DD) to UTC timestamp
 * 
 * @param time - Time string in HH:mm format
 * @param date - Date string in YYYY-MM-DD format
 * @param timezone - User timezone
 * @returns UTC Date object
 */
export function localToUTC(
	time: string,
	date: string,
	timezone: string = "UTC"
): Date {
	// Combine date and time in user timezone
	const localDateTime = dayjs.tz(`${date} ${time}`, timezone)
	// Convert to UTC
	return localDateTime.utc().toDate()
}

/**
 * Convert UTC timestamp to local Date object (in user timezone)
 * 
 * @param timestamp - UTC timestamp (Date or ISO string)
 * @param timezone - User timezone
 * @returns Date object in user timezone (keep in mind JS Date is always local/UTC, 
 *          but dayjs wrapping this will have the correct offset)
 *          Actually returning ISO string is safer for dayjs re-parsing with timezone
 */
export function UTCtoLocal(
	timestamp: Date | string,
	timezone: string = "UTC"
): string {
	return dayjs(timestamp).tz(timezone).format()
}

/**
 * Get current date in UTC (YYYY-MM-DD)
 * 
 * @returns Date string in YYYY-MM-DD format
 */
export function getCurrentDateUTC(): string {
	return dayjs.utc().format("YYYY-MM-DD")
}

/**
 * Get start of day in UTC for a given date
 * 
 * @param date - Date string in YYYY-MM-DD format
 * @returns UTC Date object at start of day
 */
export function getDayStartUTC(date: string): Date {
	return dayjs.utc(date).startOf("day").toDate()
}

/**
 * Get end of day in UTC for a given date
 * 
 * @param date - Date string in YYYY-MM-DD format
 * @returns UTC Date object at end of day
 */
export function getDayEndUTC(date: string): Date {
	return dayjs.utc(date).endOf("day").toDate()
}


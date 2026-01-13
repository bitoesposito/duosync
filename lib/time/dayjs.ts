import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import customParseFormat from "dayjs/plugin/customParseFormat"

// Extend dayjs with plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

/**
 * 24-hour time format constant (HH:mm).
 */
export const TWENTY_FOUR_HOUR_FORMAT = "HH:mm"

/**
 * Parses a time string in 24-hour format with strict validation.
 * @param value - Time string in HH:mm format
 * @returns Dayjs object (may be invalid if format doesn't match)
 */
export function parseTimeStrict(value: string) {
    return dayjs(value, TWENTY_FOUR_HOUR_FORMAT, true)
}

/**
 * Formats a time string to 24-hour format (HH:mm).
 * If the input is invalid, returns it unchanged.
 * @param value - Time string to format
 * @returns Formatted time string in HH:mm format
 */
export function formatTimeTo24h(value: string): string {
    const parsed = parseTimeStrict(value)
    return parsed.isValid() ? parsed.format(TWENTY_FOUR_HOUR_FORMAT) : value
}

export default dayjs

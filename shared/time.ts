/**
 * Canonical time utilities. The day domain is 00:00 → 23:59 = 1439 minutes.
 * Pure string/number math — no dayjs. This is the single source of truth for time
 * handling (legacy had several inconsistent copies).
 */

export const DAY_MINUTES = 23 * 60 + 59; // 1439, end-of-day "23:59"

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Strict "HH:mm" in 00:00–23:59. ("24:00" is NOT a valid value — normalize it first.) */
export function isValidTime(time: string): boolean {
  return TIME_RE.test(time);
}

/**
 * Minutes since midnight. "23:59" and the sentinel "24:00" both map to end-of-day (1439).
 * Returns NaN for anything that isn't valid — callers validate format first.
 */
export function timeToMinutes(time: string): number {
  if (time === "23:59" || time === "24:00") return DAY_MINUTES;
  const m = TIME_RE.exec(time);
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Inverse of timeToMinutes. Clamps to "23:59" at/above end-of-day. */
export function minutesToTime(minutes: number): string {
  if (Number.isNaN(minutes)) return "00:00";
  if (minutes >= DAY_MINUTES) return "23:59";
  const safe = Math.max(0, Math.floor(minutes));
  const h = Math.floor(safe / 60);
  const mm = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Position of a time on the 00:00–23:59 axis, as a percentage (0–100). */
export function timeToPercent(time: string): number {
  return (timeToMinutes(time) / DAY_MINUTES) * 100;
}

/**
 * Normalizes an end time to the canonical 00:00–23:59 range.
 * - "24:00" → "23:59"
 * - "00:00" with a start in the afternoon/evening (hour ≥ 12) → "23:59" (end-of-day)
 * Otherwise returns the value unchanged.
 */
export function normalizeEndTime(startTime: string, endTime: string): string {
  if (endTime === "24:00") return "23:59";
  if (endTime === "00:00") {
    const start = timeToMinutes(startTime);
    if (!Number.isNaN(start) && start >= 12 * 60) return "23:59";
  }
  return endTime;
}

/** Half-open interval overlap: [aStart,aEnd) intersects [bStart,bEnd). */
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

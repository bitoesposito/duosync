import { TWENTY_FOUR_HOUR_FORMAT, parseTimeStrict } from "@/lib/time/dayjs";

const END_OF_DAY = "23:59";

/**
 * Calculates the end time obtained by adding minutes to a start time.
 * Returns null if start time or duration are invalid.
 * The calculation is clamped so that it never goes past 23:59.
 */
export function calculateEndTimeFromDuration(
  startTime: string,
  durationMinutes?: number | null
): string | null {
  if (!startTime || !durationMinutes || durationMinutes <= 0) {
    return null;
  }

  const start = parseTimeStrict(startTime);
  if (!start.isValid()) {
    return null;
  }

  const maxDuration = getMinutesUntilEndOfDay(startTime);
  const safeDuration =
    typeof maxDuration === "number"
      ? Math.min(durationMinutes, maxDuration)
      : durationMinutes;

  const end = start.add(safeDuration, "minute");
  const endOfDay = parseTimeStrict(END_OF_DAY);

  if (!endOfDay.isValid()) {
    return end.format(TWENTY_FOUR_HOUR_FORMAT);
  }

  if (end.isAfter(endOfDay)) {
    return END_OF_DAY;
  }

  return end.format(TWENTY_FOUR_HOUR_FORMAT);
}

/**
 * Returns how many minutes are available between the start time and 23:59.
 * Useful to cap the duration so that we never spill into the next day.
 */
export function getMinutesUntilEndOfDay(startTime: string): number | null {
  if (!startTime) {
    return null;
  }

  const start = parseTimeStrict(startTime);
  const endOfDay = parseTimeStrict(END_OF_DAY);

  if (!start.isValid() || !endOfDay.isValid()) {
    return null;
  }

  const diff = endOfDay.diff(start, "minute");
  return diff > 0 ? diff : 0;
}


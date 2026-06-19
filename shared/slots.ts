/**
 * Free-slot finding. Used by the appointment form to suggest the next open time
 * when the chosen slot overlaps. Pure, minute-based.
 */

import type { Appointment } from "./types";
import { DAY_MINUTES, minutesToTime, timeToMinutes } from "./time";

interface Span {
  start: number;
  end: number;
}

function toSpans(appointments: ReadonlyArray<Pick<Appointment, "startTime" | "endTime">>): Span[] {
  return appointments
    .map((a) => ({ start: timeToMinutes(a.startTime), end: timeToMinutes(a.endTime) }))
    .filter((s) => !Number.isNaN(s.start) && !Number.isNaN(s.end))
    .sort((a, b) => a.start - b.start);
}

/**
 * First open time at or after `fromTime` that isn't inside an appointment.
 * Returns "HH:mm", or null if the day is full from that point.
 */
export function findFirstAvailableSlot(
  appointments: ReadonlyArray<Pick<Appointment, "startTime" | "endTime">>,
  fromTime = "00:00",
): string | null {
  let cursor = timeToMinutes(fromTime);
  if (Number.isNaN(cursor)) return null;

  for (const span of toSpans(appointments)) {
    if (cursor < span.start) return minutesToTime(cursor);
    if (cursor <= span.end) cursor = span.end;
  }

  return cursor < DAY_MINUTES ? minutesToTime(cursor) : null;
}

/** Alias: next open time strictly searched from `afterTime`. */
export function findNextAvailableSlot(
  afterTime: string,
  appointments: ReadonlyArray<Pick<Appointment, "startTime" | "endTime">>,
): string | null {
  return findFirstAvailableSlot(appointments, afterTime);
}

/** All free gaps in the day as {start,end} "HH:mm" pairs. */
export function getAvailableSlots(
  appointments: ReadonlyArray<Pick<Appointment, "startTime" | "endTime">>,
): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];
  let cursor = 0;

  for (const span of toSpans(appointments)) {
    if (cursor < span.start) {
      slots.push({ start: minutesToTime(cursor), end: minutesToTime(span.start) });
    }
    cursor = Math.max(cursor, span.end);
  }

  if (cursor < DAY_MINUTES) {
    slots.push({ start: minutesToTime(cursor), end: "23:59" });
  }

  return slots;
}

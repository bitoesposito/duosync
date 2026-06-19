/**
 * Timeline construction — the heart of DuoSync.
 *
 * Personal timeline: one user's day, gaps filled with "available".
 * Shared timeline: many users compared per segment, with the priority cascade
 *   sleep > other > available > match
 * where:
 *   - sleep     = ANY user (current or other) is asleep
 *   - other     = the CURRENT user is busy (non-sleep)
 *   - available = current user free, but at least one OTHER user is busy
 *   - match     = everyone is free at once (the "let's meet" slot)
 * Sleep ranges never count as "busy" for occupancy — sleep is resolved only by step 1.
 */

import type { Appointment, TimelineSegment, TimelineSegmentCategory } from "./types";
import { DAY_MINUTES, minutesToTime, overlaps, timeToMinutes } from "./time";

interface Range {
  startMinutes: number;
  endMinutes: number;
  category: string;
}

function toRanges(appointments: Appointment[]): Range[] {
  return appointments.map((a) => ({
    startMinutes: timeToMinutes(a.startTime),
    endMinutes: timeToMinutes(a.endTime),
    category: a.category,
  }));
}

const pct = (minutes: number): number => (minutes / DAY_MINUTES) * 100;

function isOccupied(start: number, end: number, ranges: Range[]): boolean {
  return ranges.some(
    (r) => r.category !== "sleep" && overlaps(start, end, r.startMinutes, r.endMinutes),
  );
}

function isSleeping(start: number, end: number, ranges: Range[]): boolean {
  return ranges.some(
    (r) => r.category === "sleep" && overlaps(start, end, r.startMinutes, r.endMinutes),
  );
}

function getSegmentCategory(
  start: number,
  end: number,
  current: Range[],
  others: Range[][],
): TimelineSegmentCategory {
  if (isSleeping(start, end, current)) return "sleep";
  for (const o of others) if (isSleeping(start, end, o)) return "sleep";

  if (isOccupied(start, end, current)) return "other";

  for (const o of others) if (isOccupied(start, end, o)) return "available";

  return "match";
}

/**
 * Single-user timeline: appointments in their own category, gaps as "available",
 * trailing time to end-of-day filled. Zero-width segments are dropped.
 */
export function buildTimelineSegments(appointments: Appointment[]): TimelineSegment[] {
  const sorted = [...appointments].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );
  const segments: TimelineSegment[] = [];
  let cursor = 0;

  for (const a of sorted) {
    const start = timeToMinutes(a.startTime);
    const end = timeToMinutes(a.endTime);

    if (start > cursor) {
      segments.push({
        id: `available-${minutesToTime(cursor)}`,
        left: pct(cursor),
        width: pct(start) - pct(cursor),
        category: "available",
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(start),
      });
    }

    segments.push({
      id: a.id,
      left: pct(start),
      width: pct(end) - pct(start),
      category: a.category,
      startTime: a.startTime,
      endTime: a.endTime,
    });

    cursor = end;
  }

  if (cursor < DAY_MINUTES) {
    segments.push({
      id: `available-${minutesToTime(cursor)}`,
      left: pct(cursor),
      width: pct(DAY_MINUTES) - pct(cursor),
      category: "available",
      startTime: minutesToTime(cursor),
      endTime: "23:59",
    });
  }

  return segments.filter((s) => s.width > 0);
}

/**
 * Shared timeline across the current user and every other user. Collects all
 * appointment boundaries, then classifies each inter-boundary segment.
 */
export function buildSharedTimelineSegments(
  currentUserAppointments: Appointment[],
  otherUsersAppointments: Appointment[][],
): TimelineSegment[] {
  const current = toRanges(currentUserAppointments);
  const others = otherUsersAppointments.map(toRanges);

  const points = new Set<number>([0, DAY_MINUTES]);
  for (const a of currentUserAppointments) {
    points.add(timeToMinutes(a.startTime));
    points.add(timeToMinutes(a.endTime));
  }
  for (const user of otherUsersAppointments) {
    for (const a of user) {
      points.add(timeToMinutes(a.startTime));
      points.add(timeToMinutes(a.endTime));
    }
  }

  const sorted = [...points].filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
  const segments: TimelineSegment[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    const width = pct(end) - pct(start);
    if (width <= 0) continue;

    const category = getSegmentCategory(start, end, current, others);
    segments.push({
      id: `${category}-${minutesToTime(start)}-${minutesToTime(end)}`,
      left: pct(start),
      width,
      category,
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
    });
  }

  return segments;
}

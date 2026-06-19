/**
 * Shared domain types — pure, framework-free. Imported by both the SPA and the
 * Cloudflare Pages Functions. No dependency on React, dayjs, or Cloudflare.
 */

export type AppointmentCategory = "sleep" | "other";

/** Weekday id for recurrence. 1 = Monday … 7 = Sunday. */
export type DayId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * A scheduled appointment. Times are "HH:mm" in 00:00–23:59; end-of-day is "23:59".
 * (Legacy stored end-of-day as "24:00"; the refactor normalizes to "23:59" everywhere.)
 */
export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  category: AppointmentCategory;
  description?: string;
  isRepeating: boolean;
  repeatDays: DayId[];
}

/** Form payload to create/update an appointment (no id). */
export type AppointmentInput = Omit<Appointment, "id">;

export type TimelineSegmentCategory = AppointmentCategory | "available" | "match";

/** A colored slice of a day timeline (percent-based for direct CSS layout). */
export interface TimelineSegment {
  id: string;
  left: number; // % offset 0–100
  width: number; // % width 0–100
  category: TimelineSegmentCategory;
  startTime: string;
  endTime: string;
}

export interface UserProfile {
  id: number;
  name: string;
}

/**
 * Appointment as returned by the batch API. An expanded recurring instance also
 * carries its source `templateId` so it can be edited/deleted inline.
 */
export interface DayAppointment extends Appointment {
  templateId?: string;
}

export type ValidationReason =
  | "invalid-format"
  | "end-before-start"
  | "overlap"
  | "no-days";

export type ValidationResult = { ok: true } | { ok: false; reason: ValidationReason };

/** Minimal recurring shape needed to check overlaps. */
export interface RecurringForValidation {
  id: string;
  startTime: string;
  endTime: string;
  repeatDays: DayId[];
}

/** Minimal one-time shape needed to check overlaps (carries the weekday it lands on). */
export interface OneTimeForValidation {
  id: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayId;
}

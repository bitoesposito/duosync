/**
 * Appointment + user validation. Pure functions, reused by the SPA (instant UX) and
 * the Pages Functions (authoritative server check). Mirrors legacy rules exactly,
 * minus the inconsistencies (single canonical time module, explicit "no-days" reason).
 */

import type {
  Appointment,
  AppointmentInput,
  DayId,
  OneTimeForValidation,
  RecurringForValidation,
  ValidationResult,
} from "./types";
import { isValidTime, normalizeEndTime, overlaps, timeToMinutes } from "./time";

export const MAX_USERS = 10;

/** Valid unless start is strictly after end (equal is allowed, like legacy). */
function isOrderValid(startTime: string, endTime: string): boolean {
  if (!isValidTime(startTime)) return false;
  const start = timeToMinutes(startTime);
  // "00:00" as an afternoon/evening end means end-of-day → always valid.
  if (endTime === "00:00" && start >= 12 * 60) return true;
  const normalized = endTime === "24:00" ? "23:59" : endTime;
  if (!isValidTime(normalized)) return false;
  return start <= timeToMinutes(normalized);
}

function hasValidTimes(data: Pick<AppointmentInput, "startTime" | "endTime">): boolean {
  return isValidTime(data.startTime) && isValidTime(normalizeEndTime(data.startTime, data.endTime));
}

/** Whether [startTime,endTime) overlaps any of the existing items (optionally excluding one id). */
export function wouldOverlap(
  startTime: string,
  endTime: string,
  existing: ReadonlyArray<{ id: string; startTime: string; endTime: string }>,
  excludeId?: string,
): boolean {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(normalizeEndTime(startTime, endTime));
  if (Number.isNaN(start) || Number.isNaN(end)) return false;

  return existing.some((a) => {
    if (excludeId && a.id === excludeId) return false;
    const as = timeToMinutes(a.startTime);
    const ae = timeToMinutes(a.endTime);
    if (Number.isNaN(as) || Number.isNaN(ae)) return false;
    return overlaps(start, end, as, ae);
  });
}

/** Validate a one-time appointment against the user's existing appointments for that day. */
export function validateOneTime(
  data: AppointmentInput,
  existing: Appointment[],
  excludeId?: string,
): ValidationResult {
  if (!hasValidTimes(data)) return { ok: false, reason: "invalid-format" };
  if (!isOrderValid(data.startTime, data.endTime)) return { ok: false, reason: "end-before-start" };
  if (wouldOverlap(data.startTime, data.endTime, existing, excludeId)) {
    return { ok: false, reason: "overlap" };
  }
  return { ok: true };
}

function wouldRecurringOverlap(
  startTime: string,
  endTime: string,
  repeatDays: DayId[],
  recurring: RecurringForValidation[],
  oneTime: OneTimeForValidation[],
  excludeId?: string,
): boolean {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(normalizeEndTime(startTime, endTime));
  if (Number.isNaN(start) || Number.isNaN(end)) return false;

  // One-time appointments landing on any of the selected weekdays.
  const oneTimeHit = oneTime.some((a) => {
    if (!repeatDays.includes(a.dayOfWeek)) return false;
    return overlaps(start, end, timeToMinutes(a.startTime), timeToMinutes(a.endTime));
  });
  if (oneTimeHit) return true;

  // Other recurring templates that share at least one weekday.
  return recurring.some((existing) => {
    if (excludeId && existing.id === excludeId) return false;
    if (!repeatDays.some((d) => existing.repeatDays.includes(d))) return false;
    const es = timeToMinutes(existing.startTime);
    const ee = timeToMinutes(normalizeEndTime(existing.startTime, existing.endTime));
    return overlaps(start, end, es, ee);
  });
}

/** Validate a recurring template against other templates and same-weekday one-time appointments. */
export function validateRecurring(
  data: AppointmentInput,
  recurring: RecurringForValidation[],
  oneTime: OneTimeForValidation[],
  excludeId?: string,
): ValidationResult {
  if (!hasValidTimes(data)) return { ok: false, reason: "invalid-format" };
  if (!isOrderValid(data.startTime, data.endTime)) return { ok: false, reason: "end-before-start" };
  if (!data.isRepeating || data.repeatDays.length === 0) return { ok: false, reason: "no-days" };
  if (wouldRecurringOverlap(data.startTime, data.endTime, data.repeatDays, recurring, oneTime, excludeId)) {
    return { ok: false, reason: "overlap" };
  }
  return { ok: true };
}

/** Validate an appointment of either kind (branches on isRepeating). */
export function validateAppointment(
  data: AppointmentInput,
  context: {
    oneTime?: Appointment[];
    recurring?: RecurringForValidation[];
    oneTimeOnDays?: OneTimeForValidation[];
  },
  excludeId?: string,
): ValidationResult {
  return data.isRepeating
    ? validateRecurring(data, context.recurring ?? [], context.oneTimeOnDays ?? [], excludeId)
    : validateOneTime(data, context.oneTime ?? [], excludeId);
}

/** Returns an error key if the name is invalid, else null. */
export function validateUserName(name: unknown): string | null {
  if (typeof name !== "string" || name.trim().length === 0) return "name-required";
  if (name.trim().length > 60) return "name-too-long";
  return null;
}

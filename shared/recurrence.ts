/**
 * Recurring-appointment expansion. A template applies to a date when that date's
 * weekday is in its repeatDays. Expansion produces a concrete Appointment for the day.
 */

import type { Appointment, DayId } from "./types";

/** Weekday of a "YYYY-MM-DD" date as 1–7 (1 = Monday … 7 = Sunday). */
export function dayOfWeek(dateStr: string): DayId {
  const date = new Date(dateStr + "T00:00:00");
  const js = date.getDay(); // 0 = Sunday … 6 = Saturday
  return (js === 0 ? 7 : js) as DayId;
}

/** Whether a recurring template applies on the given date. */
export function appliesOn(template: Pick<Appointment, "repeatDays">, dateStr: string): boolean {
  return template.repeatDays.includes(dayOfWeek(dateStr));
}

/** Concrete instance of a template for a date (date-suffixed id, like legacy). */
export function expandRecurringForDate(template: Appointment, dateStr: string): Appointment {
  return { ...template, id: `${template.id}-${dateStr}` };
}

/** Expand all templates that apply on the date into concrete instances. */
export function expandRecurringList(templates: Appointment[], dateStr: string): Appointment[] {
  const dow = dayOfWeek(dateStr);
  return templates
    .filter((t) => t.repeatDays.includes(dow))
    .map((t) => expandRecurringForDate(t, dateStr));
}

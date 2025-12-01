/**
 * Duration calculation utilities for appointment time inputs.
 * Handles duration calculations, available options, and quick actions validation.
 */

import { parseTimeStrict, TWENTY_FOUR_HOUR_FORMAT, default as dayjs } from "@/lib/time/dayjs";
import { Appointment } from "@/types";
import { getAvailableSlots } from "./appointments-slot-finder.service";
import { wouldOverlap } from "./appointments-time-validation.service";

/**
 * Calculates the maximum available time from a start time to the next appointment or midnight.
 * @param startTime - Start time in HH:mm format
 * @param existingAppointments - Array of existing appointments
 * @returns Maximum available time as dayjs object, or null if no time available
 */
export function calculateMaxAvailableTime(
  startTime: string,
  existingAppointments: Appointment[]
): ReturnType<typeof dayjs> | null {
  if (!startTime) return null;
  const start = dayjs(startTime, "HH:mm");
  if (!start.isValid()) return null;

  // Find the slot that contains the start time
  const slots = getAvailableSlots(existingAppointments);
  const currentSlot = slots.find((slot) => {
    const slotStart = dayjs(slot.start, "HH:mm");
    const slotEnd = dayjs(slot.end, "HH:mm");
    return (start.isAfter(slotStart) || start.isSame(slotStart)) && start.isBefore(slotEnd);
  });

  if (currentSlot) {
    const slotEnd = dayjs(currentSlot.end, "HH:mm");
    // If slot end is same as start, no time available
    if (slotEnd.isSame(start) || slotEnd.isBefore(start)) {
      return null;
    }
    return slotEnd;
  }

  // If no slot found and start is at or after 23:59, no time available
  if (start.isSame(dayjs("23:59", "HH:mm")) || start.isAfter(dayjs("23:59", "HH:mm"))) {
    return null;
  }

  // If no slot found, check until midnight
  return dayjs("23:59", "HH:mm");
}

/**
 * Calculates available hour options for duration selection.
 * @param startTime - Start time in HH:mm format
 * @param maxAvailableTime - Maximum available time as dayjs object
 * @returns Array of hour options with value and label
 */
export function calculateAvailableHours(
  startTime: string,
  maxAvailableTime: ReturnType<typeof dayjs> | null
): Array<{ value: string; label: string }> {
  if (!startTime || !maxAvailableTime) return [];
  const start = dayjs(startTime, "HH:mm");
  if (!start.isValid()) return [];

  const maxDurationMinutes = maxAvailableTime.diff(start, "minute");
  const maxHours = Math.floor(maxDurationMinutes / 60);

  const hours: Array<{ value: string; label: string }> = [];
  for (let i = 0; i <= maxHours; i++) {
    hours.push({
      value: i.toString(),
      label: `${i}h`,
    });
  }
  return hours;
}

/**
 * Calculates available minute options for duration selection (5-minute intervals).
 * @param startTime - Start time in HH:mm format
 * @param maxAvailableTime - Maximum available time as dayjs object
 * @param selectedHours - Currently selected hours (for filtering)
 * @returns Array of minute options with value and label
 */
export function calculateAvailableMinutes(
  startTime: string,
  maxAvailableTime: ReturnType<typeof dayjs> | null,
  selectedHours: string = "0"
): Array<{ value: string; label: string }> {
  // Default minutes list when no constraints
  const defaultMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min) => ({
    value: min.toString(),
    label: `${min}m`,
  }));

  if (!startTime || !maxAvailableTime) {
    return defaultMinutes;
  }

  const start = dayjs(startTime, "HH:mm");
  if (!start.isValid()) {
    return defaultMinutes;
  }

  const selectedHoursNum = parseInt(selectedHours || "0", 10);
  const maxDurationMinutes = maxAvailableTime.diff(start, "minute");
  const maxMinutesForSelectedHours = maxDurationMinutes - selectedHoursNum * 60;

  const allMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  return allMinutes
    .filter((min) => min <= maxMinutesForSelectedHours)
    .map((min) => ({
      value: min.toString(),
      label: `${min}m`,
    }));
}

/**
 * Converts hours and minutes strings to total minutes.
 * @param hours - Hours as string
 * @param minutes - Minutes as string
 * @returns Total minutes
 */
export function getTotalMinutes(hours: string, minutes: string): number {
  const h = parseInt(hours || "0", 10);
  const m = parseInt(minutes || "0", 10);
  return h * 60 + m;
}

/**
 * Returns how many minutes are available between the start time and 23:59.
 * Useful to cap the duration so that we never spill into the next day.
 * @param startTime - Start time in HH:mm format
 * @returns Minutes available until end of day, or null if invalid
 */
export function getMinutesUntilEndOfDay(startTime: string): number | null {
  if (!startTime) {
    return null;
  }

  const start = parseTimeStrict(startTime);
  const endOfDay = parseTimeStrict("23:59");

  if (!start.isValid() || !endOfDay.isValid()) {
    return null;
  }

  const diff = endOfDay.diff(start, "minute");
  return diff > 0 ? diff : 0;
}

/**
 * Calculates end time from start time and duration in minutes.
 * Handles midnight crossing by capping at 23:59.
 * Supports both required and optional duration parameters for different use cases.
 * @param startTime - Start time in HH:mm format
 * @param durationMinutes - Duration in minutes (required) or optional for null-safe version
 * @returns End time in HH:mm format, empty string if invalid, or null if duration is null/undefined
 */
export function calculateEndTimeFromDuration(
  startTime: string,
  durationMinutes: number
): string;
export function calculateEndTimeFromDuration(
  startTime: string,
  durationMinutes?: number | null
): string | null;
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

  // Use getMinutesUntilEndOfDay to cap duration at end of day
  const maxDuration = getMinutesUntilEndOfDay(startTime);
  const safeDuration =
    typeof maxDuration === "number"
      ? Math.min(durationMinutes, maxDuration)
      : durationMinutes;

  const end = start.add(safeDuration, "minute");
  const endOfDay = parseTimeStrict("23:59");

  if (!endOfDay.isValid()) {
    return end.format(TWENTY_FOUR_HOUR_FORMAT);
  }

  if (end.isAfter(endOfDay)) {
    return "23:59";
  }

  return end.format(TWENTY_FOUR_HOUR_FORMAT);
}

/**
 * Calculates duration (hours and minutes) from start and end times.
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @returns Object with hours and minutes as strings, or null if invalid
 */
export function calculateDurationFromTimes(
  startTime: string,
  endTime: string
): { hours: string; minutes: string } | null {
  if (!startTime || !endTime) return null;
  
  const start = dayjs(startTime, "HH:mm");
  const end = dayjs(endTime, "HH:mm");
  
  if (!start.isValid() || !end.isValid()) return null;
  
  const diff = end.diff(start, "minute");
  if (diff <= 0) return null;
  
  const totalHours = Math.floor(diff / 60);
  const minutes = diff % 60;
  
  // Round minutes to nearest 5-minute interval for combobox compatibility
  let roundedMinutes = Math.round(minutes / 5) * 5;
  
  // If rounded minutes is 60 or more, convert to hours
  if (roundedMinutes >= 60) {
    const additionalHours = Math.floor(roundedMinutes / 60);
    roundedMinutes = roundedMinutes % 60;
    return {
      hours: (totalHours + additionalHours).toString(),
      minutes: roundedMinutes.toString(),
    };
  }
  
  return {
    hours: totalHours.toString(),
    minutes: roundedMinutes.toString(),
  };
}

/**
 * Validates if a quick action duration would be valid (no overlap, within available time).
 * @param startTime - Start time in HH:mm format
 * @param minutes - Duration in minutes or "endOfDay"
 * @param maxAvailableTime - Maximum available time as dayjs object
 * @param existingAppointments - Array of existing appointments
 * @returns True if the quick action is valid, false otherwise
 */
export function isQuickActionValid(
  startTime: string,
  minutes: number | "endOfDay",
  maxAvailableTime: ReturnType<typeof dayjs> | null,
  existingAppointments: Appointment[]
): boolean {
  if (!startTime || !maxAvailableTime) return false;

  const start = dayjs(startTime, "HH:mm");
  if (!start.isValid()) return false;

  let calculatedMinutes = 0;
  let normalizedEnd = "";

  if (minutes === "endOfDay") {
    // Special case: check if start time is already at or after 23:59
    if (startTime === "23:59" || start.isAfter(dayjs("23:59", "HH:mm"))) {
      return false; // Cannot set end of day if already at end of day
    }
    normalizedEnd = "23:59";
    calculatedMinutes = dayjs("23:59", "HH:mm").diff(start, "minute");
  } else {
    calculatedMinutes = minutes;
    const endTime = start.add(calculatedMinutes, "minute");
    const endTimeStr = endTime.format("HH:mm");
    normalizedEnd = endTimeStr === "00:00" || endTimeStr >= "24:00" ? "23:59" : endTimeStr;
  }

  // Check that end time is different from start time (at least 1 minute difference)
  if (normalizedEnd === startTime) {
    return false;
  }

  // Check if it would exceed max available time
  const endTimeObj = dayjs(normalizedEnd, "HH:mm");
  if (endTimeObj.isAfter(maxAvailableTime) || endTimeObj.isSame(maxAvailableTime)) {
    // If maxAvailableTime is the same as startTime, no valid duration possible
    if (maxAvailableTime.isSame(start)) {
      return false;
    }
    // Check if end time would be after max available time
    if (endTimeObj.isAfter(maxAvailableTime)) {
      return false;
    }
  }

  // Check if it would overlap with existing appointments
  return !wouldOverlap(startTime, normalizedEnd, existingAppointments);
}

/**
 * Calculates duration for "end of day" quick action.
 * @param startTime - Start time in HH:mm format
 * @returns Object with hours and minutes as strings, or null if invalid
 */
export function calculateEndOfDayDuration(startTime: string): { hours: string; minutes: string } | null {
  if (startTime === "23:59") {
    return null; // Cannot set end of day if already at end of day
  }

  const start = dayjs(startTime, "HH:mm");
  const endOfDay = dayjs("23:59", "HH:mm");
  
  if (!start.isValid() || !endOfDay.isValid() || !start.isBefore(endOfDay)) {
    return null;
  }

  const calculatedMinutes = endOfDay.diff(start, "minute");
  if (calculatedMinutes <= 0) {
    return null;
  }

  const totalHours = Math.floor(calculatedMinutes / 60);
  const mins = calculatedMinutes % 60;
  
  // Round minutes to nearest 5-minute interval for combobox compatibility
  let roundedMinutes = Math.round(mins / 5) * 5;

  // If rounded minutes is 60 or more, convert to hours
  if (roundedMinutes >= 60) {
    const additionalHours = Math.floor(roundedMinutes / 60);
    roundedMinutes = roundedMinutes % 60;
    return {
      hours: (totalHours + additionalHours).toString(),
      minutes: roundedMinutes.toString(),
    };
  }

  return {
    hours: totalHours.toString(),
    minutes: roundedMinutes.toString(),
  };
}


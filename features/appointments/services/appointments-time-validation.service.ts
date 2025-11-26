/**
 * Time validation utilities - validates time format, order, and overlap checks.
 */

import { parseTimeStrict } from "@/lib/time/dayjs";
import { Appointment } from "@/types";

/**
 * Converts time to minutes since midnight for comparison.
 * Handles 23:59 as 1439 minutes (end of day).
 */
function timeToMinutes(time: string): number {
  if (time === "23:59" || time === "24:00") {
    return 23 * 60 + 59; // 1439 minutes (end of day)
  }
  const parsed = parseTimeStrict(time);
  if (!parsed.isValid()) {
    return 0;
  }
  return parsed.hour() * 60 + parsed.minute();
}

/**
 * Checks if a time range would overlap with any existing appointment.
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @param existingAppointments - Array of existing appointments
 * @param excludeAppointmentId - Optional appointment ID to exclude from check (for editing)
 * @returns True if there's an overlap, false otherwise
 */
export function wouldOverlap(
  startTime: string,
  endTime: string,
  existingAppointments: Appointment[],
  excludeAppointmentId?: string
): boolean {
  // Handle 00:00 as 23:59 when start is after 12:00, and convert 24:00 to 23:59
  let normalizedEndTime = endTime;
  if (endTime === "24:00") {
    normalizedEndTime = "23:59";
  } else if (endTime === "00:00" && parseTimeStrict(startTime).hour() >= 12) {
    normalizedEndTime = "23:59";
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(normalizedEndTime);

  if (startMinutes === 0 && endMinutes === 0) {
    return false;
  }

  return existingAppointments.some((appointment) => {
    // Skip the appointment being edited
    if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
      return false;
    }

    const appointmentStartMinutes = timeToMinutes(appointment.startTime);
    const appointmentEndMinutes = timeToMinutes(appointment.endTime);

    // Check for overlap: new starts before existing ends AND new ends after existing starts
    return startMinutes < appointmentEndMinutes && endMinutes > appointmentStartMinutes;
  });
}

/**
 * Validates time input format and basic constraints.
 * @param time - Time string to validate
 * @returns Validation result with error message if invalid
 */
export function validateTimeFormat(time: string): { valid: boolean; error?: string } {
  const parsed = parseTimeStrict(time);
  if (!parsed.isValid()) {
    return { valid: false, error: "invalid-format" };
  }
  return { valid: true };
}

/**
 * Validates that end time is after start time.
 * Handles special case: 00:00 as end time represents 23:59 (end of day) when start time is after 12:00.
 * Also converts 24:00 to 23:59 for validation.
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @returns Validation result with error message if invalid
 */
export function validateTimeOrder(
  startTime: string,
  endTime: string
): { valid: boolean; error?: string } {
  const start = parseTimeStrict(startTime);
  let end = parseTimeStrict(endTime);

  if (!start.isValid()) {
    return { valid: false, error: "invalid-format" };
  }

  // Convert 24:00 to 23:59 for validation
  if (endTime === "24:00") {
    end = parseTimeStrict("23:59");
  }

  if (!end.isValid()) {
    return { valid: false, error: "invalid-format" };
  }

  // Special case: 00:00 as end time represents 23:59 (end of day) when start is after 12:00
  if (endTime === "00:00" && start.hour() >= 12) {
    // 00:00 is valid as end time (represents 23:59) when start is in the afternoon/evening
    return { valid: true };
  }

  if (!start.isBefore(end) && !start.isSame(end)) {
    return { valid: false, error: "end-before-start" };
  }

  return { valid: true };
}


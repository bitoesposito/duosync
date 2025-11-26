/**
 * Utility functions for calculating available time slots based on existing appointments.
 * These functions help improve UX by suggesting valid times and preventing overlaps.
 */

import {
  parseTimeStrict,
  TWENTY_FOUR_HOUR_FORMAT,
  default as dayjs,
} from "@/lib/time/dayjs";
import { Appointment } from "@/types";

/**
 * Finds the first available time slot in the day, starting from 00:00 or current time.
 * @param existingAppointments - Array of existing appointments
 * @param fromTime - Optional time to start searching from (defaults to "00:00")
 * @returns First available time slot in HH:mm format, or null if no slots available
 */
export function findFirstAvailableSlot(
  existingAppointments: Appointment[],
  fromTime: string = "00:00"
): string | null {
  const startTime = parseTimeStrict(fromTime);
  if (!startTime.isValid()) {
    return null;
  }

  // Sort appointments by start time
  const sorted = [...existingAppointments].sort((a, b) => {
    const aStart = parseTimeStrict(a.startTime);
    const bStart = parseTimeStrict(b.startTime);
    return aStart.diff(bStart);
  });

  let currentTime = startTime;

  // Find the first gap
  for (const appointment of sorted) {
    const appointmentStart = parseTimeStrict(appointment.startTime);
    const appointmentEnd = parseTimeStrict(appointment.endTime);

    if (!appointmentStart.isValid() || !appointmentEnd.isValid()) {
      continue;
    }

    // If current time is before this appointment, we found a gap
    if (currentTime.isBefore(appointmentStart)) {
      return currentTime.format(TWENTY_FOUR_HOUR_FORMAT);
    }

    // Move current time to after this appointment
    if (currentTime.isBefore(appointmentEnd) || currentTime.isSame(appointmentEnd)) {
      currentTime = appointmentEnd;
    }
  }

  // Check if there's time left until end of day
  const dayEnd = dayjs("23:59", TWENTY_FOUR_HOUR_FORMAT);
  if (currentTime.isBefore(dayEnd) || currentTime.isSame(dayEnd)) {
    return currentTime.format(TWENTY_FOUR_HOUR_FORMAT);
  }

  return null; // No slots available
}

/**
 * Finds the next available time slot after a given time, considering existing appointments.
 * Returns the start time of the next available slot.
 * @param afterTime - Time string in HH:mm format to search after
 * @param existingAppointments - Array of existing appointments
 * @returns Next available time slot in HH:mm format, or null if none found
 */
export function findNextAvailableSlot(
  afterTime: string,
  existingAppointments: Appointment[]
): string | null {
  return findFirstAvailableSlot(existingAppointments, afterTime);
}

/**
 * Calculates the optimal end time for a given start time.
 * Tries to set it to 1 hour after start (rounded to nearest 15 minutes), 
 * or uses the last available time in that slot if 1 hour would overlap.
 * @param startTime - Start time in HH:mm format
 * @param existingAppointments - Array of existing appointments
 * @returns Suggested end time in HH:mm format, or null if no valid end time possible
 */
export function calculateOptimalEndTime(
  startTime: string,
  existingAppointments: Appointment[]
): string | null {
  const start = parseTimeStrict(startTime);
  if (!start.isValid()) {
    return null;
  }

  // First, check if start time itself overlaps with any appointment
  // If it does, we can't use it as a start time
  const sorted = [...existingAppointments].sort((a, b) => {
    const aStart = parseTimeStrict(a.startTime);
    const bStart = parseTimeStrict(b.startTime);
    return aStart.diff(bStart);
  });

  // Check if start time is within an existing appointment
  for (const appointment of sorted) {
    const appointmentStart = parseTimeStrict(appointment.startTime);
    const appointmentEnd = parseTimeStrict(appointment.endTime);

    if (!appointmentStart.isValid() || !appointmentEnd.isValid()) {
      continue;
    }

    // If start time is within this appointment (not at the start or end), it's invalid
    if (start.isAfter(appointmentStart) && start.isBefore(appointmentEnd)) {
      return null;
    }
  }

  // Calculate 1 hour after start, rounded to nearest 15 minutes
  const oneHourLater = start.add(1, "hour");
  const minutes = oneHourLater.minute();
  const roundedMinutes = Math.round(minutes / 15) * 15;
  let roundedEnd = oneHourLater.minute(roundedMinutes).second(0).millisecond(0);
  
  // If rounded minutes is 60, move to next hour
  if (roundedMinutes >= 60) {
    roundedEnd = roundedEnd.add(1, "hour").minute(0);
  }
  
  const suggestedEnd = roundedEnd.format(TWENTY_FOUR_HOUR_FORMAT);

  // Check if suggested end time would overlap
  if (!wouldOverlap(startTime, suggestedEnd, existingAppointments)) {
    return suggestedEnd;
  }

  // Find the last available time in the current slot (before next appointment)
  for (const appointment of sorted) {
    const appointmentStart = parseTimeStrict(appointment.startTime);
    const appointmentEnd = parseTimeStrict(appointment.endTime);

    if (!appointmentStart.isValid() || !appointmentEnd.isValid()) {
      continue;
    }

    // If start time is before this appointment, the slot ends at appointment start
    if (start.isBefore(appointmentStart)) {
      return appointmentStart.format(TWENTY_FOUR_HOUR_FORMAT);
    }

    // If start time is at the end of this appointment, continue to next
    if (start.isSame(appointmentEnd)) {
      continue;
    }
  }

  // If we get here, start time is after all appointments, can go until end of day
  return "23:59";
}

/**
 * Calculates the minimum valid end time based on the start time.
 * Ensures end time is at least 1 minute after start time.
 * Allows 00:00 as end time (representing 23:59) when start is after 12:00.
 * @param startTime - Start time in HH:mm format
 * @returns Minimum valid end time in HH:mm format
 */
export function getMinEndTime(startTime: string): string {
  const start = parseTimeStrict(startTime);
  if (!start.isValid()) {
    return "00:01";
  }

  // Add 1 minute to start time
  const minEnd = start.add(1, "minute");
  return minEnd.format(TWENTY_FOUR_HOUR_FORMAT);
}

/**
 * Checks if a time range would overlap with any existing appointment.
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @param existingAppointments - Array of existing appointments
 * @param excludeAppointmentId - Optional appointment ID to exclude from check (for editing)
 * @returns True if there's an overlap, false otherwise
 */
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
 * Gets all available time slots (gaps between appointments) for the day.
 * @param existingAppointments - Array of existing appointments
 * @returns Array of available time slots with start and end times
 */
export function getAvailableSlots(
  existingAppointments: Appointment[]
): Array<{ start: string; end: string }> {
  const sorted = [...existingAppointments].sort((a, b) => {
    const aStart = parseTimeStrict(a.startTime);
    const bStart = parseTimeStrict(b.startTime);
    return aStart.diff(bStart);
  });

  const slots: Array<{ start: string; end: string }> = [];
  let currentTime = dayjs("00:00", TWENTY_FOUR_HOUR_FORMAT);

  for (const appointment of sorted) {
    const appointmentStart = parseTimeStrict(appointment.startTime);
    const appointmentEnd = parseTimeStrict(appointment.endTime);

    if (!appointmentStart.isValid() || !appointmentEnd.isValid()) {
      continue;
    }

    // If there's a gap before this appointment, add it as an available slot
    if (currentTime.isBefore(appointmentStart)) {
      slots.push({
        start: currentTime.format(TWENTY_FOUR_HOUR_FORMAT),
        end: appointmentStart.format(TWENTY_FOUR_HOUR_FORMAT),
      });
    }

    // Move current time to after this appointment
    currentTime = appointmentEnd;
  }

  // Add final slot from last appointment to end of day
  const dayEnd = dayjs("23:59", TWENTY_FOUR_HOUR_FORMAT);
  if (currentTime.isBefore(dayEnd) || currentTime.isSame(dayEnd)) {
    slots.push({
      start: currentTime.format(TWENTY_FOUR_HOUR_FORMAT),
      end: dayEnd.format(TWENTY_FOUR_HOUR_FORMAT),
    });
  }

  return slots;
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

/**
 * Calculates a sensible initial start time for a new appointment.
 * Uses current time rounded to next 15 minutes, or finds next available slot.
 * @param existingAppointments - Array of existing appointments
 * @param currentTime - Optional current time in HH:mm format (if not provided, uses server time)
 * @returns Suggested start time in HH:mm format
 */
export function getSuggestedStartTime(
  existingAppointments: Appointment[],
  currentTime?: string
): string {
  // Use provided current time or fallback to server time (for backwards compatibility)
  let now: ReturnType<typeof dayjs>;
  if (currentTime) {
    // Parse the time string and apply it to today's date
    const [hours, minutes] = currentTime.split(":").map(Number);
    if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      // Create a dayjs object for today with the provided time
      now = dayjs().hour(hours).minute(minutes).second(0).millisecond(0);
    } else {
      now = dayjs();
    }
  } else {
    now = dayjs();
  }

  // Round up to next 15 minutes
  const minutes = now.minute();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  
  let suggestedTime;
  // If rounded minutes is 60 or more, we need to go to the next hour
  if (roundedMinutes >= 60) {
    suggestedTime = now
      .add(1, "hour")
      .minute(0)
      .second(0)
      .millisecond(0);
  } else {
    suggestedTime = now
      .minute(roundedMinutes)
      .second(0)
      .millisecond(0);
  }

  const suggestedTimeStr = suggestedTime.format(TWENTY_FOUR_HOUR_FORMAT);

  // Check if suggested time is available
  const nextSlot = findNextAvailableSlot(suggestedTimeStr, existingAppointments);
  
  // Use the later of: suggested time or next available slot
  if (nextSlot) {
    const suggested = parseTimeStrict(suggestedTimeStr);
    const next = parseTimeStrict(nextSlot);
    
    if (suggested.isValid() && next.isValid()) {
      // Use whichever is later, but prefer the suggested time if it's available
      if (suggested.isBefore(next) || suggested.isSame(next)) {
        // Check if suggested time would overlap
        const oneHourLater = suggested.add(1, "hour").format(TWENTY_FOUR_HOUR_FORMAT);
        if (!wouldOverlap(suggestedTimeStr, oneHourLater, existingAppointments)) {
          return suggestedTimeStr;
        }
      }
      return nextSlot;
    }
  }

  return suggestedTimeStr;
}

/**
 * Calculates a sensible initial end time based on start time.
 * Defaults to 1 hour after start time, or minimum valid time.
 * @param startTime - Start time in HH:mm format
 * @param existingAppointments - Array of existing appointments (to avoid overlaps)
 * @returns Suggested end time in HH:mm format
 */
export function getSuggestedEndTime(
  startTime: string,
  existingAppointments: Appointment[]
): string {
  const start = parseTimeStrict(startTime);
  if (!start.isValid()) {
    return "01:00";
  }

  // Default to 1 hour after start
  const oneHourLater = start.add(1, "hour");
  const suggestedEnd = oneHourLater.format(TWENTY_FOUR_HOUR_FORMAT);

  // Check if this would overlap with existing appointments
  if (!wouldOverlap(startTime, suggestedEnd, existingAppointments)) {
    return suggestedEnd;
  }

  // If it would overlap, find the end of the conflicting appointment
  const sorted = [...existingAppointments].sort((a, b) => {
    const aStart = parseTimeStrict(a.startTime);
    const bStart = parseTimeStrict(b.startTime);
    return aStart.diff(bStart);
  });

  for (const appointment of sorted) {
    const appointmentStart = parseTimeStrict(appointment.startTime);
    const appointmentEnd = parseTimeStrict(appointment.endTime);

    if (!appointmentStart.isValid() || !appointmentEnd.isValid()) {
      continue;
    }

    // If start time is before this appointment, the appointment ends after our start
    if (start.isBefore(appointmentEnd) && start.isAfter(appointmentStart)) {
      // Suggest end time right after this appointment
      return appointmentEnd.format(TWENTY_FOUR_HOUR_FORMAT);
    }
  }

  // Fallback: use minimum valid time (1 minute after start)
  return getMinEndTime(startTime);
}


/**
 * Time suggestion utilities - calculates optimal and suggested times for appointments.
 */

import {
  parseTimeStrict,
  TWENTY_FOUR_HOUR_FORMAT,
  default as dayjs,
} from "@/lib/time/dayjs";
import { Appointment } from "@/types";
import { wouldOverlap } from "./appointments-time-validation.service";
import { findNextAvailableSlot } from "./appointments-slot-finder.service";

/**
 * Calculates the minimum valid end time based on the start time.
 * Ensures end time is at least 1 minute after start time.
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


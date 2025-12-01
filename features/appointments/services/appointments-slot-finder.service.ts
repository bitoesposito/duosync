/**
 * Slot finder utilities - finds available time slots between appointments.
 * Also includes time correction utilities for automatically correcting invalid time inputs.
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
  // A valid appointment needs at least 1 minute, so if currentTime is 23:59,
  // there's no space available (can't create an appointment that starts and ends at 23:59)
  const dayEnd = dayjs("23:59", TWENTY_FOUR_HOUR_FORMAT);
  if (currentTime.isBefore(dayEnd)) {
    // There's at least 1 minute available (from currentTime to 23:59)
    return currentTime.format(TWENTY_FOUR_HOUR_FORMAT);
  }

  // If currentTime is 23:59 or after, no slots available
  return null;
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
  // A valid slot needs at least 1 minute, so if currentTime is 23:59,
  // there's no space available
  const dayEnd = dayjs("23:59", TWENTY_FOUR_HOUR_FORMAT);
  if (currentTime.isBefore(dayEnd)) {
    // There's at least 1 minute available (from currentTime to 23:59)
    slots.push({
      start: currentTime.format(TWENTY_FOUR_HOUR_FORMAT),
      end: dayEnd.format(TWENTY_FOUR_HOUR_FORMAT),
    });
  }

  return slots;
}

/**
 * Checks if a start time is within an existing appointment.
 * @param startTime - Start time in HH:mm format
 * @param existingAppointments - Array of existing appointments
 * @returns True if start time is within an appointment, false otherwise
 */
export function isStartTimeWithinAppointment(
  startTime: string,
  existingAppointments: Appointment[]
): boolean {
  if (!startTime) return false;
  
  const start = parseTimeStrict(startTime);
  if (!start.isValid()) return false;

  return existingAppointments.some((appointment) => {
    const appointmentStart = parseTimeStrict(appointment.startTime);
    const appointmentEnd = parseTimeStrict(appointment.endTime);

    if (!appointmentStart.isValid() || !appointmentEnd.isValid()) {
      return false;
    }

    // Check if start time is within this appointment (after start and before end)
    return start.isAfter(appointmentStart) && start.isBefore(appointmentEnd);
  });
}

/**
 * Corrects an invalid start time to the next available slot.
 * @param startTime - Start time in HH:mm format
 * @param existingAppointments - Array of existing appointments
 * @returns Corrected start time, or original if already valid
 */
export function correctStartTimeIfInvalid(
  startTime: string,
  existingAppointments: Appointment[]
): string {
  if (!startTime) return startTime;

  // Check if the start time is within an existing appointment
  if (isStartTimeWithinAppointment(startTime, existingAppointments)) {
    const nextSlot = findNextAvailableSlot(startTime, existingAppointments);
    if (nextSlot) {
      return nextSlot;
    }
  }

  return startTime;
}


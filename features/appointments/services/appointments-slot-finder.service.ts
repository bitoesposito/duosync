/**
 * Slot finder utilities - finds available time slots between appointments.
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


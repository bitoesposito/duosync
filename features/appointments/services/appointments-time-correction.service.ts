/**
 * Time correction utilities - automatically corrects invalid time inputs.
 * Handles auto-correction of start times that fall within existing appointments.
 */

import { parseTimeStrict } from "@/lib/time/dayjs";
import { Appointment } from "@/types";
import { findNextAvailableSlot } from "./appointments-time-utils.service";

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


import { useEffect, useState, useMemo } from "react";
import { Appointment } from "@/types";
import {
  findFirstAvailableSlot,
  findNextAvailableSlot,
} from "@/features/appointments/services/appointments-slot-finder.service";
import {
  calculateOptimalEndTime,
  getMinEndTime,
} from "@/features/appointments/services/appointments-time-suggestions.service";
import {
  wouldOverlap,
  validateTimeFormat,
  validateTimeOrder,
} from "@/features/appointments/services/appointments-time-validation.service";
import { parseTimeStrict } from "@/lib/time/dayjs";

type ValidationState = {
  startTimeError?: "invalid-format" | "overlap";
  endTimeError?: "invalid-format" | "end-before-start" | "overlap";
};

type UseTimeInputValidationProps = {
  startTime: string;
  endTime: string;
  existingAppointments?: Appointment[];
  disabled?: boolean;
  onValidationChange?: (isValid: boolean) => void;
};

/**
 * Hook that handles time input validation logic.
 * Manages validation state, calculates suggestions, and notifies parent of validation status.
 */
export function useTimeInputValidation({
  startTime,
  endTime,
  existingAppointments = [],
  disabled = false,
  onValidationChange,
}: UseTimeInputValidationProps) {
  const [validation, setValidation] = useState<ValidationState>({});

  // Check if there are any available slots in the day
  const hasAvailableSlots = useMemo(() => {
    if (disabled) return false;
    const firstSlot = findFirstAvailableSlot(existingAppointments);
    return firstSlot !== null;
  }, [existingAppointments, disabled]);

  // Calculate next available slot and minimum end time
  const nextAvailableSlot = useMemo(() => {
    if (!startTime || disabled) return null;
    return findNextAvailableSlot(startTime, existingAppointments);
  }, [startTime, existingAppointments, disabled]);

  const minEndTime = useMemo(() => {
    if (!startTime || disabled) return "00:01";
    return getMinEndTime(startTime);
  }, [startTime, disabled]);

  // Calculate optimal end time for the current start time
  const optimalEndTime = useMemo(() => {
    if (!startTime || disabled) return null;
    return calculateOptimalEndTime(startTime, existingAppointments);
  }, [startTime, existingAppointments, disabled]);

  // Check if start time is within an existing appointment
  const isStartTimeWithinAppointment = useMemo(() => {
    if (!startTime || disabled) return false;
    
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
  }, [startTime, existingAppointments, disabled]);

  // Validate start time
  useEffect(() => {
    if (!startTime || disabled) {
      setValidation((prev) => ({ ...prev, startTimeError: undefined }));
      return;
    }

    const formatValidation = validateTimeFormat(startTime);
    if (!formatValidation.valid) {
      setValidation((prev) => ({
        ...prev,
        startTimeError: "invalid-format",
      }));
      return;
    }

    // Check if start time is within an existing appointment
    if (isStartTimeWithinAppointment) {
      setValidation((prev) => ({
        ...prev,
        startTimeError: "overlap",
      }));
      return;
    }

    // Check for overlap only if end time is also set
    if (endTime) {
      const orderValidation = validateTimeOrder(startTime, endTime);
      if (!orderValidation.valid) {
        setValidation((prev) => ({
          ...prev,
          startTimeError: undefined, // Order error is shown on end time
        }));
        return;
      }

      if (wouldOverlap(startTime, endTime, existingAppointments)) {
        setValidation((prev) => ({
          ...prev,
          startTimeError: "overlap",
        }));
        return;
      }
    }

    setValidation((prev) => ({ ...prev, startTimeError: undefined }));
  }, [startTime, endTime, existingAppointments, disabled, isStartTimeWithinAppointment]);

  // Validate end time
  useEffect(() => {
    if (!endTime || disabled) {
      setValidation((prev) => ({ ...prev, endTimeError: undefined }));
      return;
    }

    const formatValidation = validateTimeFormat(endTime);
    if (!formatValidation.valid) {
      setValidation((prev) => ({
        ...prev,
        endTimeError: "invalid-format",
      }));
      return;
    }

    if (!startTime) {
      setValidation((prev) => ({ ...prev, endTimeError: undefined }));
      return;
    }

    const orderValidation = validateTimeOrder(startTime, endTime);
    if (!orderValidation.valid) {
      setValidation((prev) => ({
        ...prev,
        endTimeError: "end-before-start",
      }));
      return;
    }

    // For overlap check, use 23:59 if endTime is 00:00 and start is after 12:00, or if endTime is 24:00
    let endTimeForOverlap = endTime;
    if (endTime === "24:00") {
      endTimeForOverlap = "23:59";
    } else if (endTime === "00:00" && parseTimeStrict(startTime).hour() >= 12) {
      endTimeForOverlap = "23:59";
    }

    if (wouldOverlap(startTime, endTimeForOverlap, existingAppointments)) {
      setValidation((prev) => ({
        ...prev,
        endTimeError: "overlap",
      }));
      return;
    }

    setValidation((prev) => ({ ...prev, endTimeError: undefined }));
  }, [startTime, endTime, existingAppointments, disabled]);

  // Notify parent about validation state
  useEffect(() => {
    if (onValidationChange) {
      const isValid = Boolean(
        startTime &&
          endTime &&
          !validation.startTimeError &&
          !validation.endTimeError
      );
      onValidationChange(isValid);
    }
  }, [
    startTime,
    endTime,
    validation.startTimeError,
    validation.endTimeError,
    onValidationChange,
  ]);

  return {
    validation,
    hasAvailableSlots,
    nextAvailableSlot,
    minEndTime,
    optimalEndTime,
    hasStartError: validation.startTimeError !== undefined,
    hasEndError: validation.endTimeError !== undefined,
  };
}


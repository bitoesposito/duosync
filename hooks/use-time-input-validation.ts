import { useEffect, useState, useMemo } from "react";
import { Appointment, DayId, RecurringAppointmentForValidation, OneTimeAppointmentForValidation } from "@/types";
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
  timeToMinutes,
} from "@/features/appointments/services/appointments-time-validation.service";
import { fetchAppointmentsForValidation } from "@/features/appointments/services/appointments.service";
import { parseTimeStrict } from "@/lib/time/dayjs";
import { useUsers } from "@/features/users";

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
  isRepeating?: boolean;
  repeatDays?: DayId[];
};

/**
 * Checks if a time range would overlap with recurring appointments on specific days.
 * Only checks overlaps on days that are common between the new appointment and existing recurring appointments.
 */
function wouldRecurringOverlap(
  startTime: string,
  endTime: string,
  repeatDays: DayId[],
  recurringAppointments: RecurringAppointmentForValidation[],
  oneTimeAppointments: OneTimeAppointmentForValidation[],
  excludeAppointmentId?: string
): boolean {
  // Handle 00:00 as 23:59 when start is after 12:00, and convert 24:00 to 23:59
  let normalizedEndTime = endTime;
  if (endTime === "24:00") {
    normalizedEndTime = "23:59";
  } else if (endTime === "00:00" && parseTimeStrict(startTime).hour() >= 12) {
    normalizedEndTime = "23:59";
  }

  // Check overlap with one-time appointments on the same days
  const relevantOneTime = oneTimeAppointments.filter((apt) =>
    repeatDays.includes(apt.dayOfWeek)
  );
  
  if (relevantOneTime.length > 0) {
    const oneTimeOverlaps = relevantOneTime.some((apt) => {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(normalizedEndTime);
      const aptStartMinutes = timeToMinutes(apt.startTime);
      const aptEndMinutes = timeToMinutes(apt.endTime);
      return startMinutes < aptEndMinutes && endMinutes > aptStartMinutes;
    });
    if (oneTimeOverlaps) return true;
  }

  // Check overlap with recurring appointments that share at least one day
  return recurringAppointments.some((existing) => {
    // Exclude current appointment if editing
    if (excludeAppointmentId && existing.id === excludeAppointmentId) {
      return false;
    }
    
    // Check if there's any day overlap
    const hasDayOverlap = repeatDays.some((day) =>
      existing.repeatDays.includes(day)
    );
    
    if (!hasDayOverlap) {
      // No day overlap, so no conflict
      return false;
    }

    // Normalize existing endTime as well
    let normalizedExistingEndTime = existing.endTime;
    if (existing.endTime === "24:00") {
      normalizedExistingEndTime = "23:59";
    } else if (existing.endTime === "00:00" && parseTimeStrict(existing.startTime).hour() >= 12) {
      normalizedExistingEndTime = "23:59";
    }

    // Check time overlap
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(normalizedEndTime);
    const existingStartMinutes = timeToMinutes(existing.startTime);
    const existingEndMinutes = timeToMinutes(normalizedExistingEndTime);
    
    return startMinutes < existingEndMinutes && endMinutes > existingStartMinutes;
  });
}

/**
 * Hook that handles time input validation logic.
 * Manages validation state, calculates suggestions, and notifies parent of validation status.
 * For recurring appointments, fetches validation data from server to check overlaps on selected days.
 */
export function useTimeInputValidation({
  startTime,
  endTime,
  existingAppointments = [],
  disabled = false,
  onValidationChange,
  isRepeating = false,
  repeatDays = [],
  excludeAppointmentId,
}: UseTimeInputValidationProps) {
  const [validation, setValidation] = useState<ValidationState>({});
  const { activeUser } = useUsers();
  const [recurringValidationData, setRecurringValidationData] = useState<{
    recurringAppointments: RecurringAppointmentForValidation[];
    oneTimeAppointments: OneTimeAppointmentForValidation[];
  } | null>(null);
  const [isLoadingRecurringValidation, setIsLoadingRecurringValidation] = useState(false);

  // Fetch validation data for recurring appointments when isRepeating and repeatDays change
  useEffect(() => {
    if (disabled || !activeUser || !isRepeating || repeatDays.length === 0) {
      setRecurringValidationData(null);
      return;
    }

    let cancelled = false;
    setIsLoadingRecurringValidation(true);

    fetchAppointmentsForValidation(activeUser.id, repeatDays)
      .then((data) => {
        if (!cancelled) {
          setRecurringValidationData(data);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch recurring validation data:", error);
        if (!cancelled) {
          setRecurringValidationData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingRecurringValidation(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeUser?.id, isRepeating, repeatDays.join(","), disabled]);

  // Determine which appointments to use for validation
  // Use a stable reference to avoid infinite loops
  const appointmentsForValidation = useMemo(() => {
    if (isRepeating && repeatDays.length > 0 && recurringValidationData) {
      // For recurring appointments, convert validation data to Appointment[] format
      // We need to check overlaps only with recurring appointments that share days
      const relevantRecurring = recurringValidationData.recurringAppointments
        .filter((apt) => {
          // Exclude current appointment if editing
          if (excludeAppointmentId && apt.id === excludeAppointmentId) {
            return false;
          }
          // Check if there's any day overlap
          return apt.repeatDays.some((day) => repeatDays.includes(day));
        })
        .map((apt) => ({
          id: apt.id,
          startTime: apt.startTime,
          endTime: apt.endTime,
          category: "other" as const,
          isRepeating: true,
          repeatDays: apt.repeatDays,
        }));
      
      const relevantOneTime = recurringValidationData.oneTimeAppointments
        .filter((apt) => {
          // Exclude current appointment if editing
          if (excludeAppointmentId && apt.id === excludeAppointmentId) {
            return false;
          }
          return repeatDays.includes(apt.dayOfWeek);
        })
        .map((apt) => ({
          id: apt.id,
          startTime: apt.startTime,
          endTime: apt.endTime,
          category: "other" as const,
          isRepeating: false,
          repeatDays: [],
        }));

      return [...relevantRecurring, ...relevantOneTime];
    }
    // For one-time appointments, exclude current appointment if editing
    return excludeAppointmentId
      ? existingAppointments.filter((apt) => apt.id !== excludeAppointmentId)
      : existingAppointments;
  }, [
    isRepeating,
    repeatDays.join(","), // Use join to create stable string reference
    recurringValidationData,
    excludeAppointmentId,
    // Use JSON.stringify to create stable reference for existingAppointments
    // Only include essential fields to avoid unnecessary recalculations
    JSON.stringify(existingAppointments.map(apt => ({
      id: apt.id,
      startTime: apt.startTime,
      endTime: apt.endTime,
    }))),
  ]);

  // Check if there are any available slots in the day
  const hasAvailableSlots = useMemo(() => {
    if (disabled) return false;
    // For recurring appointments, we can't easily determine available slots
    // without knowing which days, so we assume slots are available
    if (isRepeating && repeatDays.length > 0) {
      return true;
    }
    const firstSlot = findFirstAvailableSlot(existingAppointments);
    return firstSlot !== null;
  }, [existingAppointments, disabled, isRepeating, repeatDays]);

  // Calculate next available slot and minimum end time
  const nextAvailableSlot = useMemo(() => {
    if (!startTime || disabled) return null;
    // For recurring appointments, we can't easily determine next slot
    // without knowing which days, so return null
    if (isRepeating && repeatDays.length > 0) {
      return null;
    }
    return findNextAvailableSlot(startTime, existingAppointments);
  }, [startTime, existingAppointments, disabled, isRepeating, repeatDays]);

  const minEndTime = useMemo(() => {
    if (!startTime || disabled) return "00:01";
    return getMinEndTime(startTime);
  }, [startTime, disabled]);

  // Calculate optimal end time for the current start time
  const optimalEndTime = useMemo(() => {
    if (!startTime || disabled) return null;
    // Use appointmentsForValidation directly
    return calculateOptimalEndTime(startTime, appointmentsForValidation);
  }, [
    startTime,
    disabled,
    // Use a stable reference by serializing appointmentsForValidation
    JSON.stringify(appointmentsForValidation.map(apt => ({
      id: apt.id,
      startTime: apt.startTime,
      endTime: apt.endTime,
    }))),
  ]);

  // Check if start time is within an existing appointment
  const isStartTimeWithinAppointment = useMemo(() => {
    if (!startTime || disabled) return false;
    
    const start = parseTimeStrict(startTime);
    if (!start.isValid()) return false;

    return appointmentsForValidation.some((appointment) => {
      const appointmentStart = parseTimeStrict(appointment.startTime);
      const appointmentEnd = parseTimeStrict(appointment.endTime);

      if (!appointmentStart.isValid() || !appointmentEnd.isValid()) {
        return false;
      }

      // Check if start time is within this appointment (after start and before end)
      return start.isAfter(appointmentStart) && start.isBefore(appointmentEnd);
    });
  }, [
    startTime,
    disabled,
    // Use a stable reference by serializing appointmentsForValidation
    JSON.stringify(appointmentsForValidation.map(apt => ({
      id: apt.id,
      startTime: apt.startTime,
      endTime: apt.endTime,
    }))),
  ]);

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

      // For recurring appointments, use special validation
      if (isRepeating && repeatDays.length > 0 && recurringValidationData) {
        if (
          wouldRecurringOverlap(
            startTime,
            endTime,
            repeatDays,
            recurringValidationData.recurringAppointments,
            recurringValidationData.oneTimeAppointments,
            excludeAppointmentId
          )
        ) {
          setValidation((prev) => ({
            ...prev,
            startTimeError: "overlap",
          }));
          return;
        }
      } else {
        // For non-recurring appointments, calculate appointments on demand
        const appointmentsToCheck = appointmentsForValidation;
        if (wouldOverlap(startTime, endTime, appointmentsToCheck)) {
          setValidation((prev) => ({
            ...prev,
            startTimeError: "overlap",
          }));
          return;
        }
      }
    }

    setValidation((prev) => ({ ...prev, startTimeError: undefined }));
  }, [
    startTime,
    endTime,
    disabled,
    isStartTimeWithinAppointment,
    isRepeating,
    repeatDays.join(","),
    recurringValidationData !== null,
    excludeAppointmentId,
    existingAppointments.length,
    existingAppointments.map(apt => apt.id).join(","),
    // Use a stable reference by serializing appointmentsForValidation
    JSON.stringify(appointmentsForValidation.map(apt => ({
      id: apt.id,
      startTime: apt.startTime,
      endTime: apt.endTime,
    }))),
  ]);

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

    // For recurring appointments, use special validation
    if (isRepeating && repeatDays.length > 0 && recurringValidationData) {
      if (
        wouldRecurringOverlap(
          startTime,
          endTimeForOverlap,
          repeatDays,
          recurringValidationData.recurringAppointments,
          recurringValidationData.oneTimeAppointments,
          excludeAppointmentId
        )
      ) {
        setValidation((prev) => ({
          ...prev,
          endTimeError: "overlap",
        }));
        return;
      }
    } else {
      // For non-recurring appointments, use appointmentsForValidation
      const appointmentsToCheck = appointmentsForValidation;
      if (wouldOverlap(startTime, endTimeForOverlap, appointmentsToCheck)) {
        setValidation((prev) => ({
          ...prev,
          endTimeError: "overlap",
        }));
        return;
      }
    }

    setValidation((prev) => ({ ...prev, endTimeError: undefined }));
  }, [
    startTime,
    endTime,
    disabled,
    isRepeating,
    repeatDays.join(","),
    recurringValidationData !== null,
    excludeAppointmentId,
    existingAppointments.length,
    existingAppointments.map(apt => apt.id).join(","),
    // Use a stable reference by serializing appointmentsForValidation
    JSON.stringify(appointmentsForValidation.map(apt => ({
      id: apt.id,
      startTime: apt.startTime,
      endTime: apt.endTime,
    }))),
  ]);

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


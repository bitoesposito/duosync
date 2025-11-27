/**
 * Hook for centralizing disabled/enabled conditions for time input fields.
 * Provides a single source of truth for when fields should be disabled.
 */

import { useMemo } from "react";
import { Appointment } from "@/types";
import { findFirstAvailableSlot } from "@/features/appointments/services/appointments-time-utils.service";

type UseTimeInputDisabledProps = {
  disabled?: boolean;
  startTime: string;
  endTime: string;
  hasStartError: boolean;
  hasEndError: boolean;
  hasAvailableSlots: boolean;
  maxAvailableTime: ReturnType<typeof import("@/lib/time/dayjs").default> | null;
  availableHours: Array<{ value: string; label: string }>;
  availableMinutes: Array<{ value: string; label: string }>;
  existingAppointments: Appointment[];
};

/**
 * Centralized hook for determining when time input fields should be disabled.
 * Consolidates all disabled conditions to avoid duplication and improve maintainability.
 */
export function useTimeInputDisabled({
  disabled = false,
  startTime,
  endTime,
  hasStartError,
  hasEndError,
  hasAvailableSlots,
  maxAvailableTime,
  availableHours,
  availableMinutes,
  existingAppointments,
}: UseTimeInputDisabledProps) {
  // Calculate minimum start time
  const minStartTime = useMemo(() => {
    const firstSlot = findFirstAvailableSlot(existingAppointments);
    return firstSlot || "00:00";
  }, [existingAppointments]);

  // Start time input disabled conditions
  // Disabled when: explicitly disabled OR no available slots in the day
  const isStartTimeDisabled = useMemo(() => {
    if (disabled) return true;
    if (!hasAvailableSlots) return true;
    return false;
  }, [disabled, hasAvailableSlots]);

  // Mode toggle buttons disabled conditions
  const isModeToggleDisabled = useMemo(() => {
    return disabled || !hasAvailableSlots || !startTime || hasStartError;
  }, [disabled, hasAvailableSlots, startTime, hasStartError]);

  // Duration hours combobox disabled conditions
  const isDurationHoursDisabled = useMemo(() => {
    return (
      disabled ||
      !startTime ||
      hasStartError ||
      !maxAvailableTime ||
      availableHours.length === 0
    );
  }, [disabled, startTime, hasStartError, maxAvailableTime, availableHours.length]);

  // Duration minutes combobox disabled conditions
  const isDurationMinutesDisabled = useMemo(() => {
    return (
      disabled ||
      !startTime ||
      hasStartError ||
      !maxAvailableTime ||
      availableMinutes.length === 0
    );
  }, [disabled, startTime, hasStartError, maxAvailableTime, availableMinutes.length]);

  // End time input disabled conditions
  const isEndTimeDisabled = useMemo(() => {
    // If no slots available at all, disable
    if (!hasAvailableSlots) return true;
    
    // If start time is set but no max available time (no space after start), disable
    if (startTime && !maxAvailableTime) return true;
    
    // Otherwise, check standard conditions
    return disabled || !startTime || hasStartError;
  }, [disabled, hasAvailableSlots, startTime, hasStartError, maxAvailableTime]);

  // Quick action buttons disabled conditions (base)
  const isQuickActionBaseDisabled = useMemo(() => {
    return disabled || !startTime || hasStartError;
  }, [disabled, startTime, hasStartError]);

  return {
    minStartTime,
    isStartTimeDisabled,
    isModeToggleDisabled,
    isDurationHoursDisabled,
    isDurationMinutesDisabled,
    isEndTimeDisabled,
    isQuickActionBaseDisabled,
  };
}


/**
 * Hook for managing duration state (hours and minutes) and syncing with start/end times.
 * Handles bidirectional sync between duration inputs and time range.
 */

import { useState, useEffect, useCallback } from "react";
import {
  calculateEndTimeFromDuration,
  calculateDurationFromTimes,
  getTotalMinutes,
} from "@/features/appointments/services/appointments-duration.service";

type UseDurationStateProps = {
  startTime: string;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  mode: "duration" | "endTime";
};

/**
 * Hook that manages duration state (hours and minutes) and syncs with start/end times.
 * When in duration mode, changes to duration update end time.
 * When end time changes externally, duration is recalculated.
 */
export function useDurationState({
  startTime,
  endTime,
  onEndTimeChange,
  mode,
}: UseDurationStateProps) {
  const [durationHours, setDurationHours] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [isUpdatingFromDuration, setIsUpdatingFromDuration] = useState(false);

  // Sync duration when start/end time changes externally (only if not updating from duration)
  useEffect(() => {
    if (isUpdatingFromDuration) return;

    if (startTime && endTime) {
      const duration = calculateDurationFromTimes(startTime, endTime);
      if (duration) {
        setDurationHours(duration.hours);
        setDurationMinutes(duration.minutes);
      }
    } else if (!endTime) {
      setDurationHours("");
      setDurationMinutes("");
    }
  }, [startTime, endTime, isUpdatingFromDuration]);

  // Update end time from duration
  const updateEndTimeFromDuration = useCallback(
    (start: string, minutes: number) => {
      if (!start) return;
      const newEndTime = calculateEndTimeFromDuration(start, minutes);
      if (newEndTime) {
        setIsUpdatingFromDuration(true);
        onEndTimeChange(newEndTime);
        // Reset flag after a short delay to allow state updates to propagate
        setTimeout(() => setIsUpdatingFromDuration(false), 0);
      }
    },
    [onEndTimeChange]
  );

  // Handle hours change
  const handleHoursChange = useCallback(
    (val: string) => {
      setDurationHours(val);
      const totalMinutes = getTotalMinutes(val, durationMinutes);
      if (totalMinutes > 0 && startTime) {
        updateEndTimeFromDuration(startTime, totalMinutes);
      } else if (totalMinutes === 0 && startTime) {
        // If both are empty or zero, clear end time
        onEndTimeChange("");
      }
    },
    [durationMinutes, startTime, updateEndTimeFromDuration, onEndTimeChange]
  );

  // Handle minutes change
  const handleMinutesChange = useCallback(
    (val: string) => {
      setDurationMinutes(val);
      const totalMinutes = getTotalMinutes(durationHours, val);
      if (totalMinutes > 0 && startTime) {
        updateEndTimeFromDuration(startTime, totalMinutes);
      } else if (totalMinutes === 0 && startTime) {
        // If both are empty or zero, clear end time
        onEndTimeChange("");
      }
    },
    [durationHours, startTime, updateEndTimeFromDuration, onEndTimeChange]
  );

  // Handle start time change in duration mode
  const handleStartTimeChangeInDurationMode = useCallback(
    (newStartTime: string) => {
      if (mode === "duration" && (durationHours || durationMinutes)) {
        const totalMinutes = getTotalMinutes(durationHours, durationMinutes);
        if (totalMinutes > 0) {
          // Keep duration constant and shift end time
          updateEndTimeFromDuration(newStartTime, totalMinutes);
        } else {
          // If duration is cleared, clear end time too
          onEndTimeChange("");
        }
      }
    },
    [mode, durationHours, durationMinutes, updateEndTimeFromDuration, onEndTimeChange]
  );

  return {
    durationHours,
    durationMinutes,
    setDurationHours,
    setDurationMinutes,
    handleHoursChange,
    handleMinutesChange,
    handleStartTimeChangeInDurationMode,
    updateEndTimeFromDuration,
  };
}


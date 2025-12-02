"use client";

import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types";
import {
  findFirstAvailableSlot,
  correctStartTimeIfInvalid,
} from "@/features/appointments/services/appointments-slot-finder.service";
import {
  calculateMaxAvailableTime,
  calculateAvailableHours,
  calculateAvailableMinutes,
  getTotalMinutes,
  isQuickActionValid,
  calculateEndOfDayDuration,
} from "@/features/appointments/services/appointments-duration.service";
import { useTimeInputValidation } from "@/hooks/use-time-input-validation";
import { useDurationState } from "@/hooks/use-duration-state";
import { useTimeInputDisabled } from "@/hooks/use-time-input-disabled";
import { StartTimeInput } from "./time-inputs/start-time-input";
import { EndTimeInput } from "./time-inputs/end-time-input";
import { DurationInputs } from "./time-inputs/duration-inputs";
import { QuickActions } from "./time-inputs/quick-actions";
import { Timer } from "lucide-react";
import dayjs from "@/lib/time/dayjs";

type TimeInputsProps = {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  disabled?: boolean;
  t: (key: string, values?: Record<string, string>) => string;
  existingAppointments?: Appointment[];
  onValidationChange?: (isValid: boolean) => void;
};

type InputMode = "duration" | "endTime";

/**
 * Time inputs component with real-time validation.
 * Shows visual feedback (red border) and tooltips for invalid inputs.
 * Supports "Duration" mode for easier mobile input.
 * 
 * Refactored to be more presentational - business logic extracted to services and hooks.
 */
export function TimeInputs({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled,
  t,
  existingAppointments = [],
  onValidationChange,
}: TimeInputsProps) {
  const [mode, setMode] = useState<InputMode>("duration");
  const [hoursComboboxOpen, setHoursComboboxOpen] = useState(false);
  const [minutesComboboxOpen, setMinutesComboboxOpen] = useState(false);

  // Validation hook
  const {
    validation,
    hasAvailableSlots,
    nextAvailableSlot,
    minEndTime,
    optimalEndTime,
    hasStartError,
    hasEndError,
  } = useTimeInputValidation({
    startTime,
    endTime,
    existingAppointments,
    disabled,
    onValidationChange,
  });

  // Duration state hook
  const {
    durationHours,
    durationMinutes,
    setDurationHours,
    setDurationMinutes,
    handleHoursChange,
    handleMinutesChange,
    handleStartTimeChangeInDurationMode,
    updateEndTimeFromDuration,
  } = useDurationState({
    startTime,
    endTime,
    onEndTimeChange,
    mode,
  });

  // Calculate max available time for duration constraints
  const maxAvailableTime = useMemo(() => {
    return calculateMaxAvailableTime(startTime, existingAppointments);
  }, [startTime, existingAppointments]);

  // Calculate available hours and minutes options
  const availableHours = useMemo(() => {
    return calculateAvailableHours(startTime, maxAvailableTime);
  }, [startTime, maxAvailableTime]);

  const availableMinutes = useMemo(() => {
    return calculateAvailableMinutes(startTime, maxAvailableTime, durationHours);
  }, [startTime, maxAvailableTime, durationHours]);

  // Disabled conditions hook
  const {
    minStartTime,
    isStartTimeDisabled,
    isModeToggleDisabled,
    isDurationHoursDisabled,
    isDurationMinutesDisabled,
    isEndTimeDisabled,
    isQuickActionBaseDisabled,
  } = useTimeInputDisabled({
    disabled,
    startTime,
    endTime,
    hasStartError,
    hasEndError,
    hasAvailableSlots,
    maxAvailableTime,
    availableHours,
    availableMinutes,
    existingAppointments,
  });

  // Handle start time change with auto-correction
  const handleStartTimeChange = (value: string) => {
    if (!value) {
      onStartTimeChange(value);
      return;
    }

    // Auto-correct if invalid
    const correctedTime = correctStartTimeIfInvalid(value, existingAppointments);
    onStartTimeChange(correctedTime);

    // If corrected, handle duration mode update
    if (correctedTime !== value && mode === "duration" && (durationHours || durationMinutes)) {
      const totalMinutes = getTotalMinutes(durationHours, durationMinutes);
      if (totalMinutes > 0) {
        updateEndTimeFromDuration(correctedTime, totalMinutes);
        return;
      }
    }

    // Handle duration mode update
    handleStartTimeChangeInDurationMode(correctedTime);

    // Legacy behavior for endTime mode
    if (correctedTime && endTime && mode === "endTime") {
      const minEnd = minEndTime;
      if (endTime < minEnd) {
        onEndTimeChange(minEnd);
      }
    }
  };

  // Handle hours select from combobox
  const handleHoursSelect = (selectedValue: string) => {
    const newValue = selectedValue === durationHours ? "" : selectedValue;
    setDurationHours(newValue);
    setHoursComboboxOpen(false);
    handleHoursChange(newValue);
  };

  // Handle minutes select from combobox
  const handleMinutesSelect = (selectedValue: string) => {
    const newValue = selectedValue === durationMinutes ? "" : selectedValue;
    setDurationMinutes(newValue);
    setMinutesComboboxOpen(false);
    handleMinutesChange(newValue);
  };

  // Handle quick actions
  const handleQuickAction = (minutes: number | "endOfDay") => {
    if (!startTime) return;

    if (minutes === "endOfDay") {
      // Special case: set end time directly to 23:59 and calculate duration from that
      if (startTime === "23:59") {
        return; // Cannot set end of day if already at end of day
      }

      const start = dayjs(startTime, "HH:mm");
      const endOfDay = dayjs("23:59", "HH:mm");
      if (start.isValid() && endOfDay.isValid() && start.isBefore(endOfDay)) {
        onEndTimeChange("23:59");

        const duration = calculateEndOfDayDuration(startTime);
        if (duration) {
          setDurationHours(duration.hours);
          setDurationMinutes(duration.minutes);
        }
      }
    } else {
      // For fixed durations, calculate normally
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      setDurationHours(hours.toString());
      setDurationMinutes(mins.toString());
      updateEndTimeFromDuration(startTime, minutes);
    }
  };

  // Check if quick action is valid
  const isQuickActionValidCheck = (minutes: number | "endOfDay"): boolean => {
    return isQuickActionValid(startTime, minutes, maxAvailableTime, existingAppointments);
  };

  // Handle start time focus
  const handleStartTimeFocus = () => {
    if (!startTime && hasAvailableSlots) {
      const firstSlot = findFirstAvailableSlot(existingAppointments);
      if (firstSlot) {
        onStartTimeChange(firstSlot);
      }
    }
  };

  // Handle end time focus
  const handleEndTimeFocus = () => {
    if (startTime && !endTime && hasAvailableSlots && optimalEndTime) {
      const normalizedOptimal = optimalEndTime === "24:00" ? "23:59" : optimalEndTime;
      onEndTimeChange(normalizedOptimal);
    }
  };

  // Handle end time change (normalize 24:00 to 23:59)
  const handleEndTimeChange = (value: string) => {
    const normalizedValue = value === "24:00" ? "23:59" : value;
    onEndTimeChange(normalizedValue);
  };

  // Error messages
  const getStartErrorMessage = () => {
    if (validation.startTimeError === "invalid-format") {
      return t("form.validation.invalidFormat");
    }
    if (validation.startTimeError === "overlap") {
      return t("form.validation.overlap");
    }
    return null;
  };

  const getEndErrorMessage = () => {
    if (validation.endTimeError === "invalid-format") {
      return t("form.validation.invalidFormat");
    }
    if (validation.endTimeError === "end-before-start") {
      return t("form.validation.endBeforeStart");
    }
    if (validation.endTimeError === "overlap") {
      return t("form.validation.overlap");
    }
    return null;
  };

  const startErrorMessage = getStartErrorMessage();
  const endErrorMessage = getEndErrorMessage();

  return (
    <div className="flex flex-col gap-4">
      {/* Start Time Section */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="start-time"
          className={cn(
            "text-muted-foreground text-xs font-medium uppercase",
            hasStartError && "text-destructive"
          )}
        >
          {t("form.startLabel")}
        </Label>
        <StartTimeInput
          id="start-time"
          value={startTime}
          onChange={handleStartTimeChange}
          onFocus={handleStartTimeFocus}
          min={minStartTime}
          hasError={hasStartError}
          errorMessage={startErrorMessage}
          nextAvailableSlot={nextAvailableSlot}
          disabled={isStartTimeDisabled}
          t={t}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Separator />

        {/* Mode Toggle Section */}
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground text-xs font-medium uppercase flex items-center gap-2">
            <Timer className="w-4 h-4" />
            {t("form.modeDuration")}
          </Label>
          <ButtonGroup className="w-full overflow-x-auto border border-border rounded-none p-0.5">
            <Button
              className="flex-1 gap-2 cursor-pointer rounded-none border-none shadow-none h-9 text-sm cursor-pointer"
              variant={mode === "duration" ? "secondary" : "ghost"}
              onClick={() => setMode("duration")}
              disabled={isModeToggleDisabled}
            >
              {t("form.modeDuration")}
            </Button>
            <Button
              className="flex-1 gap-2 cursor-pointer rounded-none border-none shadow-none h-9 text-sm cursor-pointer"
              variant={mode === "endTime" ? "secondary" : "ghost"}
              onClick={() => setMode("endTime")}
              disabled={isModeToggleDisabled}
            >
              {t("form.endLabel")}
            </Button>
          </ButtonGroup>
        </div>

        <Separator />
      </div>

      {/* End Time / Duration Section */}
      {mode === "duration" ? (
        <div className="flex flex-col gap-3">
          <DurationInputs
            hours={durationHours}
            minutes={durationMinutes}
            availableHours={availableHours}
            availableMinutes={availableMinutes}
            hoursComboboxOpen={hoursComboboxOpen}
            minutesComboboxOpen={minutesComboboxOpen}
            onHoursComboboxOpenChange={setHoursComboboxOpen}
            onMinutesComboboxOpenChange={setMinutesComboboxOpen}
            onHoursSelect={handleHoursSelect}
            onMinutesSelect={handleMinutesSelect}
            hoursDisabled={isDurationHoursDisabled}
            minutesDisabled={isDurationMinutesDisabled}
            t={t}
          />

          {/* Calculated End Time Display */}
          {endTime && !hasEndError && startTime && (
            <div className="flex items-center gap-2 px-2 py-1">
              <span className="text-xs text-muted-foreground">
                {t("form.endLabel")}:
              </span>
              <span className="text-sm font-semibold text-foreground">
                {endTime}
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <QuickActions
            onQuickAction={handleQuickAction}
            isQuickActionValid={isQuickActionValidCheck}
            baseDisabled={isQuickActionBaseDisabled}
            t={t}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="end-time"
            className={cn(
              "text-muted-foreground text-xs font-medium uppercase",
              hasEndError && "text-destructive"
            )}
          >
            {t("form.endLabel")}
          </Label>
          <EndTimeInput
            id="end-time"
            value={endTime}
            onChange={handleEndTimeChange}
            onFocus={handleEndTimeFocus}
            min={minEndTime}
            hasError={hasEndError}
            errorMessage={endErrorMessage}
            startTime={startTime}
            disabled={isEndTimeDisabled}
            t={t}
          />
        </div>
      )}
    </div>
  );
}
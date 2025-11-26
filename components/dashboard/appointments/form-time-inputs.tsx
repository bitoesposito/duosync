"use client";

import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types";
import {
  findFirstAvailableSlot,
  findNextAvailableSlot,
  calculateOptimalEndTime,
  getMinEndTime,
  wouldOverlap,
  validateTimeFormat,
  validateTimeOrder,
} from "@/features/appointments/services/appointments-time-utils.service";
import { parseTimeStrict } from "@/lib/time/dayjs";

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

type ValidationState = {
  startTimeError?: "invalid-format" | "overlap";
  endTimeError?: "invalid-format" | "end-before-start" | "overlap";
};

/**
 * Time inputs component with real-time validation.
 * Shows visual feedback (red border) and tooltips for invalid inputs.
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
  }, [startTime, endTime, existingAppointments, disabled]);

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

  const handleStartTimeChange = (value: string) => {
    onStartTimeChange(value);
    // If end time becomes invalid, suggest minimum end time
    if (value && endTime) {
      const minEnd = getMinEndTime(value);
      if (endTime < minEnd) {
        onEndTimeChange(minEnd);
      }
    }
  };

  const handleStartTimeFocus = () => {
    // If field is empty, suggest first available slot
    if (!startTime && hasAvailableSlots) {
      const firstSlot = findFirstAvailableSlot(existingAppointments);
      if (firstSlot) {
        onStartTimeChange(firstSlot);
      }
    }
  };

  const handleEndTimeFocus = () => {
    // If start time is set and end time is empty, suggest optimal end time
    if (startTime && !endTime && hasAvailableSlots) {
      const optimal = calculateOptimalEndTime(startTime, existingAppointments);
      if (optimal) {
        // Convert 24:00 to 23:59 if needed
        const normalizedOptimal = optimal === "24:00" ? "23:59" : optimal;
        onEndTimeChange(normalizedOptimal);
      }
    }
  };

  const handleEndTimeChange = (value: string) => {
    // Convert 24:00 to 23:59 automatically
    const normalizedValue = value === "24:00" ? "23:59" : value;
    onEndTimeChange(normalizedValue);
  };

  const hasStartError = validation.startTimeError !== undefined;
  const hasEndError = validation.endTimeError !== undefined;

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
    <div className="flex gap-3">
      <div className="flex flex-col gap-1 w-full">
        <Label
          htmlFor="start-time"
          className={cn(
            "text-muted-foreground text-xs font-medium uppercase",
            hasStartError && "text-destructive"
          )}
        >
          {t("form.startLabel")}
        </Label>
        {hasStartError && startErrorMessage ? (
          <Popover>
            <PopoverTrigger asChild>
              <div className="w-full">
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className={cn(
                    "w-full bg-transparent border-border rounded-none h-10 text-sm",
                    hasStartError &&
                      "border-destructive focus-visible:border-destructive"
                  )}
                  aria-invalid={hasStartError}
                  lang="it-IT"
                  min="00:00"
                  max="23:59"
                  step="60"
                  disabled={disabled || !hasAvailableSlots}
                  placeholder={!hasAvailableSlots ? t("form.noSlotsAvailable") : undefined}
                  title={!hasAvailableSlots ? t("form.noSlotsAvailable") : undefined}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="rounded-none border-border w-auto p-3">
              <div className="space-y-1">
                <p className="font-semibold text-sm">{startErrorMessage}</p>
                {nextAvailableSlot && validation.startTimeError === "overlap" && (
                  <p className="text-xs text-muted-foreground">
                    {t("form.validation.startTimeHint", {
                      time: nextAvailableSlot,
                    })}
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            onFocus={handleStartTimeFocus}
            className={cn(
              "w-full bg-transparent border-border rounded-none h-10 text-sm",
              hasStartError &&
                "border-destructive focus-visible:border-destructive"
            )}
            aria-invalid={hasStartError}
            lang="it-IT"
            min="00:00"
            max="23:59"
            step="60"
            disabled={disabled || !hasAvailableSlots}
            placeholder={!hasAvailableSlots ? t("form.noSlotsAvailable") : undefined}
            title={!hasAvailableSlots ? t("form.noSlotsAvailable") : undefined}
          />
        )}
      </div>

      <div className="flex flex-col gap-1 w-full">
        <Label
          htmlFor="end-time"
          className={cn(
            "text-muted-foreground text-xs font-medium uppercase",
            hasEndError && "text-destructive"
          )}
        >
          {t("form.endLabel")}
        </Label>
        {hasEndError && endErrorMessage ? (
          <Popover>
            <PopoverTrigger asChild>
              <div className="w-full">
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className={cn(
                    "w-full bg-transparent border-border rounded-none h-10 text-sm",
                    hasEndError &&
                      "border-destructive focus-visible:border-destructive"
                  )}
                  aria-invalid={hasEndError}
                  lang="it-IT"
                  min={minEndTime}
                  max="23:59"
                  step="60"
                  disabled={disabled || !hasAvailableSlots || !startTime}
                  placeholder={!hasAvailableSlots ? t("form.noSlotsAvailable") : undefined}
                  title={!hasAvailableSlots ? t("form.noSlotsAvailable") : undefined}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="rounded-none border-border w-auto p-3">
              <div className="space-y-1">
                <p className="font-semibold text-sm">{endErrorMessage}</p>
                {validation.endTimeError === "end-before-start" && startTime && (
                  <p className="text-xs text-muted-foreground">
                    {t("form.validation.endTimeHint", { time: minEndTime })}
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => handleEndTimeChange(e.target.value)}
            onFocus={handleEndTimeFocus}
            className={cn(
              "w-full bg-transparent border-border rounded-none h-10 text-sm",
              hasEndError &&
                "border-destructive focus-visible:border-destructive"
            )}
            aria-invalid={hasEndError}
            lang="it-IT"
            min={minEndTime}
            max="23:59"
            step="60"
            disabled={disabled || !hasAvailableSlots || !startTime}
            placeholder={!hasAvailableSlots ? t("form.noSlotsAvailable") : undefined}
            title={!hasAvailableSlots ? t("form.noSlotsAvailable") : undefined}
          />
        )}
      </div>
    </div>
  );
}
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types";
import {
  findFirstAvailableSlot,
  getMinEndTime,
} from "@/features/appointments/services/appointments-time-utils.service";
import { useTimeInputValidation } from "@/hooks/use-time-input-validation";

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
    if (startTime && !endTime && hasAvailableSlots && optimalEndTime) {
      // Convert 24:00 to 23:59 if needed
      const normalizedOptimal = optimalEndTime === "24:00" ? "23:59" : optimalEndTime;
      onEndTimeChange(normalizedOptimal);
    }
  };

  const handleEndTimeChange = (value: string) => {
    // Convert 24:00 to 23:59 automatically
    const normalizedValue = value === "24:00" ? "23:59" : value;
    onEndTimeChange(normalizedValue);
  };

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
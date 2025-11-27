"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types";
import {
  findFirstAvailableSlot,
  getMinEndTime,
} from "@/features/appointments/services/appointments-time-utils.service";
import { useTimeInputValidation } from "@/hooks/use-time-input-validation";
import dayjs from "@/lib/time/dayjs";
import { Clock, Timer, ChevronRight } from "lucide-react";

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

  const [mode, setMode] = useState<InputMode>("duration");
  const [durationHours, setDurationHours] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");

  // Helper to calculate total minutes from hours and minutes
  const getTotalMinutes = (hours: string, minutes: string): number => {
    const h = parseInt(hours || "0", 10);
    const m = parseInt(minutes || "0", 10);
    return h * 60 + m;
  };

  // Sync duration when start/end time changes externally and we are NOT editing duration
  useEffect(() => {
    if (startTime && endTime) {
      const start = dayjs(startTime, "HH:mm");
      const end = dayjs(endTime, "HH:mm");
      if (start.isValid() && end.isValid()) {
        const diff = end.diff(start, "minute");
        if (diff > 0) {
          const hours = Math.floor(diff / 60);
          const minutes = diff % 60;
          setDurationHours(hours.toString());
          setDurationMinutes(minutes.toString());
        }
      }
    } else if (!endTime) {
      setDurationHours("");
      setDurationMinutes("");
    }
  }, [startTime, endTime]);

  const updateEndTimeFromDuration = (start: string, minutes: number) => {
    if (!start) return;
    const startDate = dayjs(start, "HH:mm");
    if (startDate.isValid()) {
      const endDate = startDate.add(minutes, "minute");
      // If we crossed midnight, cap at 23:59
      if (!endDate.isSame(startDate, "day")) {
        onEndTimeChange("23:59");
      } else {
        onEndTimeChange(endDate.format("HH:mm"));
      }
    }
  };

  const handleStartTimeChange = (value: string) => {
    onStartTimeChange(value);

    if (mode === "duration" && (durationHours || durationMinutes)) {
      // If in duration mode, keep duration constant and shift end time
      const totalMinutes = getTotalMinutes(durationHours, durationMinutes);
      if (totalMinutes > 0) {
        updateEndTimeFromDuration(value, totalMinutes);
        return;
      }
    }

    // Legacy behavior for endTime mode
    if (value && endTime) {
      const minEnd = getMinEndTime(value);
      if (endTime < minEnd) {
        onEndTimeChange(minEnd);
      }
    }
  };

  const handleDurationHoursChange = (val: string) => {
    setDurationHours(val);
    const totalMinutes = getTotalMinutes(val, durationMinutes);
    if (totalMinutes > 0 && startTime) {
      updateEndTimeFromDuration(startTime, totalMinutes);
    } else if (totalMinutes === 0 && startTime) {
      // If both are empty or zero, clear end time
      onEndTimeChange("");
    }
  };

  const handleDurationMinutesChange = (val: string) => {
    setDurationMinutes(val);
    const totalMinutes = getTotalMinutes(durationHours, val);
    if (totalMinutes > 0 && startTime) {
      updateEndTimeFromDuration(startTime, totalMinutes);
    } else if (totalMinutes === 0 && startTime) {
      // If both are empty or zero, clear end time
      onEndTimeChange("");
    }
  };

  const handlePresetClick = (minutes: number | "endOfDay") => {
    if (!startTime) return;

    let calculatedMinutes = 0;

    if (minutes === "endOfDay") {
      const start = dayjs(startTime, "HH:mm");
      const endOfDay = dayjs("23:59", "HH:mm");
      calculatedMinutes = endOfDay.diff(start, "minute");
    } else {
      calculatedMinutes = minutes;
    }

    const hours = Math.floor(calculatedMinutes / 60);
    const mins = calculatedMinutes % 60;
    setDurationHours(hours.toString());
    setDurationMinutes(mins.toString());
    updateEndTimeFromDuration(startTime, calculatedMinutes);
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
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Separator />

        {/* Mode Toggle Section */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t("form.modeDuration")}</span>
          </div>
          <Switch
            checked={mode === "duration"}
            onCheckedChange={(checked) => setMode(checked ? "duration" : "endTime")}
            disabled={disabled || !startTime}
            className="cursor-pointer"
          />
        </div>

        <Separator />

      </div>

      {/* End Time / Duration Section */}
      {mode === "duration" ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="duration-hours"
                className="text-muted-foreground text-xs font-medium uppercase"
              >
                {t("form.durationHoursLabel")}
              </Label>
              <Input
                id="duration-hours"
                type="number"
                value={durationHours}
                onChange={(e) => handleDurationHoursChange(e.target.value)}
                className="w-full bg-transparent border-border rounded-none h-10 text-sm"
                disabled={disabled || !startTime}
                min="0"
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="duration-minutes"
                className="text-muted-foreground text-xs font-medium uppercase"
              >
                {t("form.durationMinutesLabel")}
              </Label>
              <Input
                id="duration-minutes"
                type="number"
                value={durationMinutes}
                onChange={(e) => handleDurationMinutesChange(e.target.value)}
                className="w-full bg-transparent border-border rounded-none h-10 text-sm"
                disabled={disabled || !startTime}
                min="0"
                max="59"
                placeholder="0"
              />
            </div>
          </div>

          {/* Calculated End Time Display */}
          {endTime && !hasEndError && startTime && (
            <div className="flex items-center justify-between px-2 py-2 bg-muted/30 rounded-sm border border-border/50">
              <span className="text-xs text-muted-foreground">
                {t("form.endLabel")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{endTime}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-xs font-medium uppercase">
              {t("form.quickPresetsLabel")}
            </Label>
            <div className="w-full overflow-x-auto pb-1">
              <ToggleGroup
                type="single"
                value={getTotalMinutes(durationHours, durationMinutes).toString()}
                onValueChange={(val) => {
                  if (!val) return;
                  if (val === "endOfDay") handlePresetClick("endOfDay");
                  else handlePresetClick(parseInt(val, 10));
                }}
                className="justify-start gap-2"
              >
                <ToggleGroupItem
                  value="endOfDay"
                  className="h-9 px-4 text-sm border border-border rounded-sm whitespace-nowrap data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
                >
                  {t("form.endOfDay")}
                </ToggleGroupItem>
                {[30, 60, 90, 120].map((m) => (
                  <ToggleGroupItem
                    key={m}
                    value={m.toString()}
                    className="h-9 px-4 text-sm border border-border rounded-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
                  >
                    {m < 60
                      ? `${m}m`
                      : `${Math.floor(m / 60)}h${m % 60 > 0 ? " " + (m % 60) + "m" : ""}`}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
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
            />
          )}
        </div>
      )}
    </div>
  );
}
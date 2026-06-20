import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DAY_MINUTES,
  findNextAvailableSlot,
  isValidTime,
  minutesToTime,
  normalizeEndTime,
  timeToMinutes,
} from "@shared";
import type { Appointment, DayId } from "@shared";

type TimeInputsProps = {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  disabled?: boolean;
  t: (key: string, values?: Record<string, string>) => string;
  existingAppointments?: Appointment[];
  onValidationChange?: (isValid: boolean) => void;
  isRepeating?: boolean;
  repeatDays?: DayId[];
  excludeId?: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0–23
const MINUTES = [0, 5, 10, 15, 20, 30, 45];
const inputClass = "bg-transparent border-border rounded-none h-10 text-sm";

/** Start time + (end time | duration) with inline validation via the shared domain. */
export function TimeInputs({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled,
  t,
  existingAppointments = [],
  onValidationChange,
  isRepeating = false,
  repeatDays = [],
  excludeId,
}: TimeInputsProps) {
  const [mode, setMode] = useState<"endTime" | "duration">("endTime");
  const [durHours, setDurHours] = useState(1);
  const [durMinutes, setDurMinutes] = useState(0);

  // In duration mode the end time is derived from start + duration.
  useEffect(() => {
    if (mode !== "duration" || !startTime || !isValidTime(startTime)) return;
    onEndTimeChange(
      minutesToTime(Math.min(timeToMinutes(startTime) + durHours * 60 + durMinutes, DAY_MINUTES)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, startTime, durHours, durMinutes]);

  const errorKey = useMemo<"invalidFormat" | "endBeforeStart" | "overlap" | null>(() => {
    if (!startTime || !endTime) return null;
    const normEnd = normalizeEndTime(startTime, endTime);
    if (!isValidTime(startTime) || !isValidTime(normEnd)) return "invalidFormat";
    const s = timeToMinutes(startTime);
    const e = timeToMinutes(normEnd);
    if (e <= s) return "endBeforeStart";
    if (!isRepeating) {
      const overlap = existingAppointments.some(
        (a) =>
          a.id !== excludeId &&
          timeToMinutes(a.startTime) < e &&
          timeToMinutes(a.endTime) > s,
      );
      if (overlap) return "overlap";
    }
    return null;
  }, [startTime, endTime, isRepeating, existingAppointments, excludeId]);

  const isValid =
    !!startTime && !!endTime && errorKey === null && (!isRepeating || repeatDays.length > 0);

  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const suggestion = useMemo(
    () =>
      errorKey === "overlap"
        ? findNextAvailableSlot(startTime, existingAppointments.filter((a) => a.id !== excludeId))
        : null,
    [errorKey, startTime, existingAppointments, excludeId],
  );

  const hasStartError = errorKey === "invalidFormat";
  const hasEndError = errorKey === "endBeforeStart" || errorKey === "overlap";
  const errorMessage = errorKey ? t(`form.validation.${errorKey}`) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="start-time"
          className={cn("text-muted-foreground text-xs font-medium uppercase", hasStartError && "text-destructive")}
        >
          {t("form.startLabel")}
        </Label>
        <Input
          id="start-time"
          type="time"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
          disabled={disabled}
          aria-invalid={hasStartError}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Separator />
        <ButtonGroup className="w-full overflow-x-auto border border-border rounded-none p-0.5">
          <Button
            className="flex-1 gap-2 cursor-pointer rounded-none border-none shadow-none h-9 text-sm"
            variant={mode === "endTime" ? "secondary" : "ghost"}
            onClick={() => setMode("endTime")}
            disabled={disabled}
          >
            {t("form.modeEndTime")}
          </Button>
          <Button
            className="flex-1 gap-2 cursor-pointer rounded-none border-none shadow-none h-9 text-sm"
            variant={mode === "duration" ? "secondary" : "ghost"}
            onClick={() => setMode("duration")}
            disabled={disabled}
          >
            {t("form.modeDuration")}
          </Button>
        </ButtonGroup>
        <Separator />
      </div>

      {mode === "endTime" ? (
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="end-time"
            className={cn("text-muted-foreground text-xs font-medium uppercase", hasEndError && "text-destructive")}
          >
            {t("form.endLabel")}
          </Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value === "24:00" ? "23:59" : e.target.value)}
            disabled={disabled}
            aria-invalid={hasEndError}
            className={inputClass}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground text-xs font-medium uppercase">
                {t("form.durationHoursLabel")}
              </Label>
              <Select
                value={String(durHours)}
                onValueChange={(v) => setDurHours(Number(v))}
                disabled={disabled}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border max-h-60">
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)} className="rounded-none">
                      {h}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground text-xs font-medium uppercase">
                {t("form.durationMinutesLabel")}
              </Label>
              <Select
                value={String(durMinutes)}
                onValueChange={(v) => setDurMinutes(Number(v))}
                disabled={disabled}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border max-h-60">
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={String(m)} className="rounded-none">
                      {m}m
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {endTime && !hasEndError && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs text-muted-foreground">{t("form.endLabel")}:</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">{endTime}</span>
            </div>
          )}
        </div>
      )}

      {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
      {suggestion && (
        <button
          type="button"
          onClick={() => onStartTimeChange(suggestion)}
          className="text-left text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {t("form.nextSlotHint", { time: suggestion })}
        </button>
      )}
    </div>
  );
}

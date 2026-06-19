import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { findNextAvailableSlot, isValidTime, minutesToTime, normalizeEndTime, timeToMinutes } from "@shared";
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

const HOURS = Array.from({ length: 13 }, (_, i) => i); // 0–12
const MINUTES = [0, 15, 30, 45];
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
    !!startTime &&
    !!endTime &&
    errorKey === null &&
    (!isRepeating || repeatDays.length > 0);

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

  const applyDuration = (h: number, m: number) => {
    if (!startTime || !isValidTime(startTime)) return;
    onEndTimeChange(minutesToTime(Math.min(timeToMinutes(startTime) + h * 60 + m, 23 * 60 + 59)));
  };

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
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-xs font-medium uppercase">
              {t("form.durationHoursLabel")}
            </Label>
            <select
              value={durHours}
              onChange={(e) => {
                const h = Number(e.target.value);
                setDurHours(h);
                applyDuration(h, durMinutes);
              }}
              disabled={disabled}
              className={inputClass}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>{h}h</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-xs font-medium uppercase">
              {t("form.durationMinutesLabel")}
            </Label>
            <select
              value={durMinutes}
              onChange={(e) => {
                const m = Number(e.target.value);
                setDurMinutes(m);
                applyDuration(durHours, m);
              }}
              disabled={disabled}
              className={inputClass}
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>{m}m</option>
              ))}
            </select>
          </div>
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

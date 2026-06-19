import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import { useUpsertAppointment } from "@/features/appointments/useAppointments";
import { findNextAvailableSlot, validateOneTime, validateRecurring } from "@shared";
import type { AppointmentCategory, AppointmentInput, DayAppointment, DayId, ValidationResult } from "@shared";

const DAYS: DayId[] = [1, 2, 3, 4, 5, 6, 7];
const inputClass = "h-8 rounded-md border border-border bg-background px-2 text-sm";

interface Props {
  userId: number;
  date: string;
  dayAppointments: DayAppointment[];
  editing: DayAppointment | null;
  onDone: () => void;
}

export function AppointmentForm({ userId, date, dayAppointments, editing, onDone }: Props) {
  const { t } = useI18n();
  const upsert = useUpsertAppointment(date);

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [category, setCategory] = useState<AppointmentCategory>("other");
  const [description, setDescription] = useState("");
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatDays, setRepeatDays] = useState<DayId[]>([]);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    setStartTime(editing.startTime);
    setEndTime(editing.endTime);
    setCategory(editing.category);
    setDescription(editing.description ?? "");
    setIsRepeating(editing.isRepeating);
    setRepeatDays(editing.repeatDays);
    setClientError(null);
  }, [editing]);

  const excludeId = editing ? (editing.templateId ?? editing.id) : undefined;

  const toggleDay = (d: DayId) =>
    setRepeatDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const suggestion = useMemo(
    () => findNextAvailableSlot(startTime, dayAppointments.filter((a) => a.id !== excludeId)),
    [startTime, dayAppointments, excludeId],
  );

  const reset = () => {
    setStartTime("09:00");
    setEndTime("10:00");
    setCategory("other");
    setDescription("");
    setIsRepeating(false);
    setRepeatDays([]);
    setClientError(null);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setClientError(null);
    const data: AppointmentInput = {
      startTime,
      endTime,
      category,
      description: description.trim() || undefined,
      isRepeating,
      repeatDays,
    };
    const result: ValidationResult = isRepeating
      ? validateRecurring(data, [], [], excludeId)
      : validateOneTime(data, dayAppointments, excludeId);
    if (!result.ok) {
      setClientError(result.reason);
      return;
    }
    upsert.mutate(
      { userId, appointment: excludeId ? { ...data, id: excludeId } : data },
      {
        onSuccess: () => {
          reset();
          onDone();
        },
      },
    );
  };

  const errorKey = clientError ?? (upsert.isError ? "generic" : null);
  const showSuggestion = clientError === "overlap" && suggestion !== null && suggestion !== startTime;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="text-sm font-medium">{editing ? t("form.save") : t("form.title")}</div>

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs">
          {t("form.start")}
          <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          {t("form.end")}
          <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          {t("form.category")}
          <select value={category} onChange={(e) => setCategory(e.target.value as AppointmentCategory)} className={inputClass}>
            <option value="other">{t("common.categories.other")}</option>
            <option value="sleep">{t("common.categories.sleep")}</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs">
        {t("form.description")}
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("form.descriptionPlaceholder")}
          className={inputClass}
        />
      </label>

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={isRepeating} onChange={(e) => setIsRepeating(e.target.checked)} />
        {t("form.repeats")}
      </label>

      {isRepeating && (
        <div className="flex flex-col gap-1 text-xs">
          {t("form.selectDays")}
          <div className="flex flex-wrap gap-1">
            {DAYS.map((d) => (
              <Button
                key={d}
                type="button"
                size="xs"
                variant={repeatDays.includes(d) ? "default" : "outline"}
                onClick={() => toggleDay(d)}
              >
                {t(`common.daysShort.${d}`)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {showSuggestion && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {t("form.suggestion", { time: suggestion })}
          <Button type="button" size="xs" variant="ghost" onClick={() => setStartTime(suggestion)}>
            {t("form.useSuggestion", { time: suggestion })}
          </Button>
        </div>
      )}

      {errorKey && <div className="text-xs text-destructive">{t(`errors.${errorKey}`)}</div>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={upsert.isPending}>
          {upsert.isPending ? t("form.saving") : editing ? t("form.save") : t("form.submit")}
        </Button>
        {editing && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              reset();
              onDone();
            }}
          >
            {t("form.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}

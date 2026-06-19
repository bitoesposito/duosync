import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import { useDeleteAppointment } from "@/features/appointments/useAppointments";
import { timeToMinutes } from "@shared";
import type { DayAppointment } from "@shared";

interface Props {
  date: string;
  userName: string;
  appointments: DayAppointment[];
  onEdit: (appointment: DayAppointment) => void;
}

export function AppointmentList({ date, userName, appointments, onEdit }: Props) {
  const { t } = useI18n();
  const del = useDeleteAppointment(date);
  const sorted = [...appointments].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium text-muted-foreground">{t("list.title", { name: userName })}</div>
      {sorted.length === 0 ? (
        <div className="text-xs text-muted-foreground">{t("list.empty")}</div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sorted.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm"
            >
              <span className={`size-2.5 rounded-sm ${a.category === "sleep" ? "bg-sleep" : "bg-other"}`} />
              <span className="tabular-nums">
                {a.startTime}–{a.endTime}
              </span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {a.description ?? t(`common.categories.${a.category}`)}
              </span>
              {a.isRepeating && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {t("list.recurring")}
                </span>
              )}
              <Button size="xs" variant="ghost" onClick={() => onEdit(a)}>
                {t("list.edit")}
              </Button>
              <Button
                size="xs"
                variant="destructive"
                disabled={del.isPending}
                onClick={() => del.mutate({ id: a.id, isRepeating: a.isRepeating, templateId: a.templateId })}
              >
                {t("list.delete")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

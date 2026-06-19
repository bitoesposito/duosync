import { useMemo, useState } from "react";
import { ClockIcon } from "lucide-react";
import AppointmentsListItem from "./list-item";
import AppointmentEditDialog from "./appointment-edit-dialog";
import { useAppointments } from "@/features/appointments/useAppointments";
import { useI18n } from "@/i18n/useI18n";
import { timeToMinutes } from "@shared";
import type { DayAppointment } from "@shared";

/** Today's appointments for the active user, grouped by category. */
export default function AppointmentsList() {
  const { appointments, updateAppointment, removeAppointment, isLoading, isSaving } = useAppointments();
  const { t } = useI18n();
  const [editing, setEditing] = useState<DayAppointment | null>(null);
  const hasAppointments = appointments.length > 0;

  const { sleepAppointments, otherAppointments } = useMemo(() => {
    const sleep: DayAppointment[] = [];
    const other: DayAppointment[] = [];
    for (const a of appointments) (a.category === "sleep" ? sleep : other).push(a);
    const byStart = (a: DayAppointment, b: DayAppointment) =>
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    sleep.sort(byStart);
    other.sort(byStart);
    return { sleepAppointments: sleep, otherAppointments: other };
  }, [appointments]);

  return (
    <section className="w-full flex flex-col gap-4">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ClockIcon className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-medium tracking-tight">{t("list.title")}</h2>
        </div>
      </header>

      {isLoading ? (
        <div className="py-12 border border-dashed border-border bg-muted/5 text-center">
          <p className="text-sm text-muted-foreground">{t("list.loading")}</p>
        </div>
      ) : !hasAppointments ? (
        <div className="py-12 border border-dashed border-border bg-muted/5 text-center">
          <p className="text-sm text-muted-foreground">{t("list.empty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sleepAppointments.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                {t("common.categories.sleep")}
              </h3>
              <div className="grid gap-px bg-border border border-border">
                {sleepAppointments.map((a) => (
                  <AppointmentsListItem
                    key={a.id}
                    appointment={a}
                    onEdit={() => setEditing(a)}
                    onRemove={() => removeAppointment(a.id, a.isRepeating, a.templateId)}
                    disabled={isSaving}
                  />
                ))}
              </div>
            </div>
          )}

          {otherAppointments.length > 0 && (
            <div className="flex flex-col gap-2">
              {sleepAppointments.length > 0 && (
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  {t("common.categories.other")}
                </h3>
              )}
              <div className="grid gap-px bg-border border border-border">
                {otherAppointments.map((a) => (
                  <AppointmentsListItem
                    key={a.id}
                    appointment={a}
                    onEdit={() => setEditing(a)}
                    onRemove={() => removeAppointment(a.id, a.isRepeating, a.templateId)}
                    disabled={isSaving}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AppointmentEditDialog
        appointment={editing}
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSave={async (id, data) => {
          await updateAppointment(id, data);
        }}
        existingAppointments={appointments}
      />
    </section>
  );
}

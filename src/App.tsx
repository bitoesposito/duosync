import { useEffect, useState } from "react";
import { Header } from "@/components/header/Header";
import { Legend, Timeline } from "@/components/timeline/Timeline";
import { AppointmentForm } from "@/components/appointment-form/AppointmentForm";
import { AppointmentList } from "@/components/appointments/AppointmentList";
import { useUsers } from "@/features/users/useUsers";
import { useAppointments } from "@/features/appointments/useAppointments";
import { useTimelines } from "@/features/availability/useTimelines";
import { useI18n } from "@/i18n/useI18n";
import { useUiStore } from "@/store/ui";
import type { DayAppointment } from "@shared";

const todayISO = () => new Date().toISOString().slice(0, 10);

export function App() {
  const { t } = useI18n();
  const date = todayISO();
  const usersQuery = useUsers();
  const appointmentsQuery = useAppointments(date);
  const activeUserId = useUiStore((s) => s.activeUserId);
  const setActiveUserId = useUiStore((s) => s.setActiveUserId);
  const [editing, setEditing] = useState<DayAppointment | null>(null);

  const users = usersQuery.data ?? [];

  // Keep a valid active user selected once the list loads.
  useEffect(() => {
    if (users.length === 0) return;
    if (activeUserId == null || !users.some((u) => u.id === activeUserId)) {
      setActiveUserId(users[0].id);
    }
  }, [users, activeUserId, setActiveUserId]);

  const { personal, shared } = useTimelines(appointmentsQuery.data, activeUserId);
  const activeUser = users.find((u) => u.id === activeUserId);
  const myAppointments =
    activeUserId != null ? (appointmentsQuery.data?.[activeUserId] ?? []) : [];

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-5 p-4 sm:p-6">
      <Header users={users} />

      {users.length === 0 ? (
        <div className="text-sm text-muted-foreground">{t("timeline.empty")}</div>
      ) : (
        <>
          <div>
            <h1 className="font-heading text-xl font-semibold">
              {t("dashboard.greeting", { name: activeUser?.name ?? "" })}
            </h1>
            <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
          </div>

          <div className="flex flex-col gap-4">
            <Timeline title={t("timeline.personal")} segments={personal} />
            <Timeline title={t("timeline.shared")} segments={shared} />
            <Legend />
          </div>

          {activeUserId != null && (
            <AppointmentForm
              userId={activeUserId}
              date={date}
              dayAppointments={myAppointments}
              editing={editing}
              onDone={() => setEditing(null)}
            />
          )}

          {activeUser && (
            <AppointmentList
              date={date}
              userName={activeUser.name}
              appointments={myAppointments}
              onEdit={setEditing}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;

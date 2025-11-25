// Main dashboard component tying together form, list and timeline via context.
"use client";

import AvailabilityGrid from "./availability-grid";
import AppointmentsForm from "./appointments/form";
import AppointmentsList from "./appointments/list";
import { AppointmentsProvider } from "@/features/appointments";
import { useUsers, useI18n } from "@/hooks";

export default function Dashboard() {
  const { activeUser } = useUsers();
  const providerKey = activeUser?.id ?? "guest";
  const { t } = useI18n();

  const greetingName = activeUser?.name ?? t("dashboard.greetingFallback");

  return (
    <main className="max-w-5xl mx-auto py-4 px-4 lg:px-0 flex flex-col gap-4">
      <header className="space-y-0.5">
        <h2 className="text-xl font-medium tracking-tight">
          {t("dashboard.greeting", { name: greetingName })}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("dashboard.subtitle")}
        </p>
      </header>

      {/* Provider che espone lo stato degli impegni a tutti i widget */}
      <AppointmentsProvider key={providerKey}>
        <div className="grid grid-cols-12 gap-4 items-start">
          {/* Colonna sinistra: form per inserire nuovi impegni */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 sticky top-6">
            <AppointmentsForm />
          </div>

          {/* Colonna destra: timeline e lista degli impegni */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col gap-6">
            <AvailabilityGrid />
            <AppointmentsList />
          </div>
        </div>
      </AppointmentsProvider>
    </main>
  );
}

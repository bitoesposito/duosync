/**
 * Main dashboard component that ties together form, list and timeline via context.
 * This is a presentational component that orchestrates the dashboard layout.
 */
"use client";

import AvailabilityGrid from "./availability-grid";
import AppointmentsForm from "./appointments/form";
import AppointmentsList from "./appointments/list";
import { AppointmentsProvider } from "@/features/appointments";
import { useAppointments } from "@/features/appointments";
import { useI18n } from "@/i18n";
import { useUsers } from "@/features/users";
import { Loader2Icon } from "lucide-react";

export default function Dashboard() {
  const { activeUser, isLoading: isLoadingUsers } = useUsers();
  const providerKey = activeUser?.id ?? "guest";
  const { t } = useI18n();

  const greetingName = activeUser?.name ?? t("dashboard.greetingFallback");

  return (
    <main className="max-w-5xl mx-auto py-4 px-4 lg:px-0 flex flex-col gap-4 relative">
      <AppointmentsProvider key={providerKey}>
        <DashboardContentWithLoader
          isLoadingUsers={isLoadingUsers}
          greetingName={greetingName}
        />
      </AppointmentsProvider>
    </main>
  );
}

/**
 * Wrapper component that handles loading states and displays the dashboard header.
 */
function DashboardContentWithLoader({
  isLoadingUsers,
  greetingName,
}: {
  isLoadingUsers: boolean;
  greetingName: string;
}) {
  const { isLoading: isLoadingAppointments } = useAppointments();
  const { t } = useI18n();
  const showOverlay = isLoadingUsers || isLoadingAppointments;

  return (
    <>
      {showOverlay && <DashboardLoader />}
      <header
        className={`space-y-0.5 ${showOverlay ? "opacity-40 pointer-events-none" : ""}`}
      >
        <h2 className="text-xl font-medium tracking-tight">
          {t("dashboard.greeting", { name: greetingName })}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("dashboard.subtitle")}
        </p>
      </header>

      <DashboardContent showOverlay={showOverlay} />
    </>
  );
}

/**
 * Main dashboard content grid with form on the left and timeline/list on the right.
 */
function DashboardContent({ showOverlay }: { showOverlay: boolean }) {
  return (
    <div
      className={`grid grid-cols-12 gap-4 items-start ${
        showOverlay ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <div className="col-span-12 md:col-span-4 lg:col-span-3 sticky top-6">
        <AppointmentsForm />
      </div>

      <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col gap-6">
        <AvailabilityGrid />
        <AppointmentsList />
      </div>
    </div>
  );
}

/**
 * Loading overlay displayed when data is being fetched.
 */
function DashboardLoader() {
  const { t } = useI18n();
  return (
    <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-sm">
      <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {t("availability.loading")}
      </p>
    </div>
  );
}

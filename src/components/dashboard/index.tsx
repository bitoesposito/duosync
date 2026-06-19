import { Loader2Icon } from "lucide-react";
import AvailabilityGrid from "./availability-grid";
import AppointmentsForm from "./appointments/form";
import AppointmentsList from "./appointments/list";
import { useAppointments } from "@/features/appointments/useAppointments";
import { useUsers } from "@/features/users/useUsers";
import { useI18n } from "@/i18n/useI18n";

export default function Dashboard() {
  const { activeUser, isLoading: isLoadingUsers } = useUsers();
  const { isLoading: isLoadingAppointments } = useAppointments();
  const { t } = useI18n();

  const greetingName = activeUser?.name ?? t("dashboard.greetingFallback");
  const showOverlay = isLoadingUsers || isLoadingAppointments;

  return (
    <main className="max-w-5xl mx-auto py-4 px-4 lg:px-0 flex flex-col gap-4 relative">
      {showOverlay && (
        <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-sm">
          <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("availability.loading")}</p>
        </div>
      )}

      <header className={`space-y-0.5 ${showOverlay ? "opacity-40 pointer-events-none" : ""}`}>
        <h2 className="text-xl font-medium tracking-tight">
          {t("dashboard.greeting", { name: greetingName })}
        </h2>
        <p className="text-muted-foreground text-sm">{t("dashboard.subtitle")}</p>
      </header>

      <div
        className={`grid grid-cols-12 gap-4 items-start ${showOverlay ? "opacity-40 pointer-events-none" : ""}`}
      >
        <div className="col-span-12 md:col-span-4 lg:col-span-3 md:sticky md:top-6 relative z-10 md:z-auto">
          <AppointmentsForm />
        </div>

        <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col gap-6">
          <AvailabilityGrid />
          <AppointmentsList />
        </div>
      </div>
    </main>
  );
}

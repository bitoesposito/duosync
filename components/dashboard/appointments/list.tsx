import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ClockIcon, CheckIcon } from "lucide-react";
import AppointmentsListItem from "./list-item";
import AppointmentsListSkeleton from "./list-skeleton";
import { useAppointments, useI18n } from "@/hooks";

// Appointment list that consumes the context directly without parent props.
export default function AppointmentsList() {
  const { appointments, removeAppointment, isLoading, isSaving } =
    useAppointments();
  const { t } = useI18n();
  const hasAppointments = appointments.length > 0;
  const confirmDisabled = !hasAppointments || isLoading || isSaving;

  return (
    <section className="w-full flex flex-col gap-4">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ClockIcon className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-medium tracking-tight">
            {t("list.title")}
          </h2>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                disabled={confirmDisabled}
                size="sm"
                className="rounded-none font-medium h-9 px-4"
              >
                <CheckIcon className="w-4 h-4 mr-2" /> {t("list.confirm")}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-none border-border">
              {t("list.confirmTooltip")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      {isLoading ? (
        <AppointmentsListSkeleton />
      ) : !hasAppointments ? (
        <div className="py-12 border border-dashed border-border bg-muted/5 text-center">
          <p className="text-sm text-muted-foreground">
            {t("list.empty")}
          </p>
        </div>
      ) : (
        <div className="grid gap-px bg-border border border-border">
          {appointments.map((appointment) => (
            <AppointmentsListItem
              key={appointment.id}
              appointment={appointment}
              onRemove={() => removeAppointment(appointment.id)}
              disabled={isSaving}
            />
          ))}
        </div>
      )}
    </section>
  );
}

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ClockIcon, CheckIcon } from "lucide-react";
import AppointmentsListItem from "./list-item";
import AppointmentEditDialog from "./appointment-edit-dialog";
import { useAppointments } from "@/features/appointments";
import { useI18n } from "@/i18n";
import { useNotifications } from "@/hooks";
import { parseTimeStrict } from "@/lib/time/dayjs";
import { Appointment } from "@/types";

/**
 * Sorts appointments by start time (ascending).
 */
function sortByStartTime(a: Appointment, b: Appointment): number {
  const aStart = parseTimeStrict(a.startTime);
  const bStart = parseTimeStrict(b.startTime);
  if (!aStart.isValid() || !bStart.isValid()) {
    return 0;
  }
  return aStart.diff(bStart);
}

// Appointment list that consumes the context directly without parent props.
export default function AppointmentsList() {
  const { appointments, updateAppointment, removeAppointment, isLoading, isSaving } =
    useAppointments();
  const { t } = useI18n();
  const { isSupported, permission, requestPermission, notify, isReady } =
    useNotifications();
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const hasAppointments = appointments.length > 0;
  const confirmDisabled = !hasAppointments || isLoading || isSaving;

  /**
   * Handles the confirm button click: requests permission if needed and sends a test notification.
   */
  const handleConfirm = async () => {
    if (!isSupported) {
      console.warn("Notifications are not supported in this browser");
      return;
    }

    // Request permission if not already granted
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        console.warn("Notification permission denied");
        return;
      }
    }

    // Wait for service worker to be ready
    if (!isReady) {
      console.warn("Service worker not ready yet");
      return;
    }

    // Send test notification
    const title = t("notifications.confirm.title");
    const body = t("notifications.confirm.body");
    
    await notify(title, {
      body,
      tag: "appointment-confirmation",
    });
  };

  // Separate and sort appointments by category
  const { sleepAppointments, otherAppointments } = useMemo(() => {
    const sleep: Appointment[] = [];
    const other: Appointment[] = [];

    appointments.forEach((appointment) => {
      if (appointment.category === "sleep") {
        sleep.push(appointment);
      } else {
        other.push(appointment);
      }
    });

    // Sort both lists by start time
    sleep.sort(sortByStartTime);
    other.sort(sortByStartTime);

    return {
      sleepAppointments: sleep,
      otherAppointments: other,
    };
  }, [appointments]);

  return (
    <section className="w-full flex flex-col gap-4">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ClockIcon className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-medium tracking-tight">{t("list.title")}</h2>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild className="cursor-pointer">
              <Button
                disabled={confirmDisabled}
                size="sm"
                className="rounded-none font-medium h-9 px-4"
                onClick={handleConfirm}
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
        <div className="py-12 border border-dashed border-border bg-muted/5 text-center">
          <p className="text-sm text-muted-foreground">
            {t("list.loading")}
          </p>
        </div>
      ) : !hasAppointments ? (
        <div className="py-12 border border-dashed border-border bg-muted/5 text-center">
          <p className="text-sm text-muted-foreground">
            {t("list.empty")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Sleep appointments section */}
          {sleepAppointments.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                {t("common.categories.sleep")}
              </h3>
              <div className="grid gap-px bg-border border border-border">
                {sleepAppointments.map((appointment) => (
                  <AppointmentsListItem
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={() => setEditingAppointment(appointment)}
                    onRemove={() => removeAppointment(appointment.id)}
                    disabled={isSaving}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other appointments section */}
          {otherAppointments.length > 0 && (
            <div className="flex flex-col gap-2">
              {sleepAppointments.length > 0 && (
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  {t("common.categories.other")}
                </h3>
              )}
              <div className="grid gap-px bg-border border border-border">
                {otherAppointments.map((appointment) => (
                  <AppointmentsListItem
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={() => setEditingAppointment(appointment)}
                    onRemove={() => removeAppointment(appointment.id)}
                    disabled={isSaving}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AppointmentEditDialog
        appointment={editingAppointment}
        open={editingAppointment !== null}
        onOpenChange={(open) => {
          if (!open) setEditingAppointment(null);
        }}
        onSave={async (appointmentId, updatedAppointment) => {
          await updateAppointment(appointmentId, updatedAppointment);
        }}
        existingAppointments={appointments}
      />
    </section>
  );
}

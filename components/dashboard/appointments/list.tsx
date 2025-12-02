import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ClockIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import AppointmentsListItem from "./list-item";
import AppointmentEditDialog from "./appointment-edit-dialog";
import { useAppointments } from "@/features/appointments";
import { useUsers } from "@/features/users";
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
  const { appointments, recurringTemplates, updateAppointment, removeAppointment, isLoading, isSaving } =
    useAppointments();
  const { activeUser } = useUsers();
  const { t } = useI18n();
  const { isSupported, permission, requestPermission, notify, isReady } =
    useNotifications();
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showInactiveRecurring, setShowInactiveRecurring] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const hasAppointments = appointments.length > 0;
  const confirmDisabled = !hasAppointments || isLoading || isSaving || isConfirming || !activeUser?.id;

  /**
   * Handles the confirm button click: sends push notifications to other users.
   */
  const handleConfirm = async () => {
    if (!activeUser?.id) {
      console.warn("No active user selected");
      return;
    }

    setIsConfirming(true);

    try {
      // Send push notifications to other users via API
      const response = await fetch("/api/notifications/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: activeUser.id,
        }),
      });

      if (!response.ok) {
        console.error("Failed to send confirmation notifications");
      } else {
        const result = await response.json();
        console.log(`Notifications sent: ${result.sent}, failed: ${result.failed}`);
      }

      // Also show a local notification for feedback
      if (isSupported && permission === "granted" && isReady) {
        const title = t("notifications.confirm.title");
        const body = t("notifications.confirm.body");
        
        await notify(title, {
          body,
          tag: "appointment-confirmation",
        });
      }
    } catch (error) {
      console.error("Error confirming appointments:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  // Separate and sort appointments by category
  const { sleepAppointments, otherAppointments, inactiveRecurringTemplates } = useMemo(() => {
    const sleep: Appointment[] = [];
    const other: Appointment[] = [];

    // Get active appointment IDs (recurring active today have format: {templateId}-{date})
    const activeRecurringIds = new Set(
      appointments
        .filter((apt) => apt.isRepeating)
        .map((apt) => {
          // Extract template ID from date-suffixed ID (format: {templateId}-{date})
          const parts = apt.id.split("-");
          if (parts.length >= 4) {
            // Check if last 3 parts form a date (YYYY-MM-DD)
            const potentialDate = parts.slice(-3).join("-");
            if (potentialDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              return parts.slice(0, -3).join("-");
            }
          }
          return apt.id;
        })
    );

    // Filter out recurring templates that are already active today
    // Handle case where recurringTemplates might be undefined
    const inactiveRecurring = (recurringTemplates || []).filter(
      (template) => !activeRecurringIds.has(template.id)
    );

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
    inactiveRecurring.sort(sortByStartTime);

    return {
      sleepAppointments: sleep,
      otherAppointments: other,
      inactiveRecurringTemplates: inactiveRecurring,
    };
  }, [appointments, recurringTemplates]);

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
                className="rounded-none font-medium h-9 px-4 cursor-pointer"
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
      ) : !hasAppointments && inactiveRecurringTemplates.length === 0 ? (
        <div className="py-12 border border-dashed border-border bg-muted/5 text-center">
          <p className="text-sm text-muted-foreground">
            {t("list.empty")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Show empty state if no active appointments but there are inactive recurring */}
          {!hasAppointments && inactiveRecurringTemplates.length > 0 && (
            <div className="py-12 border border-dashed border-border bg-muted/5 text-center">
              <p className="text-sm text-muted-foreground">
                {t("list.empty")}
              </p>
            </div>
          )}
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

          {/* Inactive recurring templates section (collapsible) */}
          {inactiveRecurringTemplates.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowInactiveRecurring(!showInactiveRecurring)}
                className="flex items-center justify-between px-1 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <span>
                  {t("list.inactiveRecurring", { count: inactiveRecurringTemplates.length })}
                </span>
                {showInactiveRecurring ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </button>
              {showInactiveRecurring && (
                <div className="grid gap-px bg-border border border-border opacity-60">
                  {inactiveRecurringTemplates.map((appointment) => (
                    <AppointmentsListItem
                      key={appointment.id}
                      appointment={appointment}
                      onEdit={() => setEditingAppointment(appointment)}
                      onRemove={() => removeAppointment(appointment.id)}
                      disabled={isSaving}
                    />
                  ))}
                </div>
              )}
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

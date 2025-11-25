import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ClockIcon, CheckIcon } from "lucide-react";
import AppointmentsListItem from "./list-item";
import { useAppointments } from "@/hooks";

// Appointment list that consumes the context directly without parent props.
export default function AppointmentsList() {
  const { appointments, removeAppointment } = useAppointments();
  const hasAppointments = appointments.length > 0;

  return (
    <section className="w-full flex flex-col gap-6 ">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ClockIcon className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-medium tracking-tight">
            Lista impegni
          </h2>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled={!hasAppointments} size="sm" className="rounded-none font-medium h-9 px-4">
                <CheckIcon className="w-4 h-4 mr-2" /> Conferma
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-none border-border">
              Invia una richiesta all&apos;altro utente per confermare gli impegni
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      {!hasAppointments ? (
        <div className="py-12 border border-dashed border-border bg-muted/5 text-center">
          <p className="text-sm text-muted-foreground">
            Nessun impegno aggiunto.
          </p>
        </div>
      ) : (
        <div className="grid gap-px bg-border border border-border">
          {appointments.map((appointment) => (
            <AppointmentsListItem
              key={appointment.id}
              appointment={appointment}
              onRemove={() => removeAppointment(appointment.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

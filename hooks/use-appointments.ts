import { useAppointmentsContext } from "@/features/appointments/appointments-context";

/**
 * Public hook that exposes the appointments context to presentation components.
 * Keeping it in /hooks allows other features to orchestrate the same data source.
 */
export function useAppointments() {
  return useAppointmentsContext();
}
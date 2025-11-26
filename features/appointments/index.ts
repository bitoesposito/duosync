/**
 * Appointments feature - public API.
 * 
 * Exports:
 * - AppointmentsProvider: Context provider for appointments state
 * - useAppointments: Hook to access appointments state and operations
 * - Client-safe appointment service functions (business logic, API calls)
 * - Time utility functions (slot finding, validation, suggestions)
 * 
 * NOTE: Server-side DB functions are NOT exported here to prevent client bundling.
 * API routes should import directly from "./services/appointments.db.service"
 */
export {
  AppointmentsProvider,
  useAppointmentsContext as useAppointments,
} from "./appointments-context";
export * from "./services/appointments.service";
export * from "./services/appointments-time-utils.service";
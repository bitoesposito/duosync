/**
 * Appointments feature - public API.
 * 
 * Exports:
 * - AppointmentsProvider: Context provider for appointments state
 * - useAppointments: Hook to access appointments state and operations
 * - Client-safe appointment service functions (business logic, API calls)
 * - Time utility functions (slot finding, validation, suggestions, duration)
 * 
 * NOTE: Server-side DB functions are NOT exported here to prevent client bundling.
 * API routes should import directly from "./services/appointments.db.service"
 */
export {
  AppointmentsProvider,
  useAppointmentsContext as useAppointments,
} from "./appointments-context";
export * from "./services/appointments.service";
// Time utilities - exported from specific modules
export {
  findFirstAvailableSlot,
  findNextAvailableSlot,
  getAvailableSlots,
  isStartTimeWithinAppointment,
  correctStartTimeIfInvalid,
} from "./services/appointments-slot-finder.service";
export {
  wouldOverlap,
  validateTimeFormat,
  validateTimeOrder,
} from "./services/appointments-time-validation.service";
export {
  getMinEndTime,
  calculateOptimalEndTime,
  getSuggestedStartTime,
  getSuggestedEndTime,
} from "./services/appointments-time-suggestions.service";
export {
  calculateMaxAvailableTime,
  calculateAvailableHours,
  calculateAvailableMinutes,
  getTotalMinutes,
  calculateEndTimeFromDuration,
  getMinutesUntilEndOfDay,
  calculateDurationFromTimes,
  isQuickActionValid,
  calculateEndOfDayDuration,
} from "./services/appointments-duration.service";
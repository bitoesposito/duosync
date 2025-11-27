/**
 * Hooks folder for app-level hooks that orchestrate multiple features.
 * 
 * Exports:
 * - useOtherUserAppointments: Hook to fetch other user's appointments for availability comparison
 * - useTimeInputValidation: Hook for time input validation logic
 * - useDurationState: Hook for managing duration state and syncing with start/end times
 * - useTimeInputDisabled: Hook for centralizing disabled/enabled conditions for time inputs
 */
export * from "./use-other-user-appointments";
export * from "./use-time-input-validation";
export * from "./use-duration-state";
export * from "./use-time-input-disabled";

/**
 * Time utilities barrel export - re-exports all time-related utilities.
 * 
 * This file maintains backward compatibility by re-exporting all functions
 * from the split modules. New code should import directly from the specific modules:
 * - appointments-slot-finder.service.ts
 * - appointments-time-validation.service.ts
 * - appointments-time-suggestions.service.ts
 */

// Slot finder utilities
export {
  findFirstAvailableSlot,
  findNextAvailableSlot,
  getAvailableSlots,
} from "./appointments-slot-finder.service";

// Validation utilities
export {
  wouldOverlap,
  validateTimeFormat,
  validateTimeOrder,
} from "./appointments-time-validation.service";

// Suggestion utilities
export {
  getMinEndTime,
  calculateOptimalEndTime,
  getSuggestedStartTime,
  getSuggestedEndTime,
} from "./appointments-time-suggestions.service";

// Duration utilities
export {
  calculateMaxAvailableTime,
  calculateAvailableHours,
  calculateAvailableMinutes,
  getTotalMinutes,
  calculateEndTimeFromDuration,
  calculateDurationFromTimes,
  isQuickActionValid,
  calculateEndOfDayDuration,
} from "./appointments-duration.service";

// Time correction utilities
export {
  isStartTimeWithinAppointment,
  correctStartTimeIfInvalid,
} from "./appointments-time-correction.service";
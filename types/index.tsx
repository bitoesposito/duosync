/**
 * Central type definitions for the entire application.
 * All domain types, context types, and shared types are defined here.
 */

// ============================================================================
// APPOINTMENTS
// ============================================================================

/**
 * Appointment categories supported by the application.
 */
export type AppointmentCategory = "sleep" | "other";

/**
 * Day identifiers used for recurrence: 1-7 = Mon-Sun
 */
export type DayId = "1" | "2" | "3" | "4" | "5" | "6" | "7";

/**
 * Represents a single scheduled appointment.
 */
export type Appointment = {
  /** Unique identifier used as the `key` within lists */
  id: string;
  /** Start time in HH:mm format */
  startTime: string;
  /** End time in HH:mm format */
  endTime: string;
  /** Appointment category (sleep, other, etc.) */
  category: AppointmentCategory;
  /** Free-text description entered by the user */
  description?: string;
  /** Whether the appointment is recurring */
  isRepeating: boolean;
  /** Selected weekdays for the recurrence (1-7) */
  repeatDays: DayId[];
};

/**
 * Payload emitted by the form to create a new appointment (without the id).
 */
export type AppointmentFormData = Omit<Appointment, "id">;

/**
 * Internal form state type used for building AppointmentFormData.
 */
export type AppointmentFormState = {
  startTime: string;
  endTime: string;
  category: AppointmentCategory;
  description?: string;
  isRepeating: boolean;
  repeatDays: DayId[];
};

/**
 * Result of appointment validation.
 */
export type AppointmentValidationResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid-format" | "end-before-start" | "overlap";
    };

// ============================================================================
// USERS
// ============================================================================

/**
 * Profile of a dashboard user that can be selected from the header.
 */
export type UserProfile = {
  /** Stable numeric identifier shared with the appointments storage */
  id: number;
  /** Human friendly name rendered in the UI */
  name: string;
};

// ============================================================================
// AVAILABILITY & TIMELINE
// ============================================================================

/**
 * Category for timeline segments (appointment categories + availability states).
 */
export type TimelineSegmentCategory = AppointmentCategory | "available" | "match";

/**
 * Represents a segment in the timeline visualization.
 */
export type TimelineSegment = {
  id: string;
  left: number;
  width: number;
  category: TimelineSegmentCategory;
  startTime: string;
  endTime: string;
};

// ============================================================================
// CONTEXTS
// ============================================================================

/**
 * Value exposed by the AppointmentsContext to components.
 */
export type AppointmentsContextValue = {
  appointments: Appointment[];
  addAppointment: (data: AppointmentFormData) => void;
  updateAppointment: (id: string, appointment: Appointment) => Promise<void>;
  removeAppointment: (id: string) => void;
  isLoading: boolean;
  isSaving: boolean;
};

/**
 * Value exposed by the UsersContext to components.
 */
export type UsersContextValue = {
  users: UserProfile[];
  activeUser?: UserProfile;
  selectUser: (userId: number) => void;
  createUser: (name: string) => Promise<UserProfile>;
  updateUser: (id: number, name: string) => Promise<UserProfile>;
  deleteUser: (id: number) => Promise<void>;
  refreshUsers: () => Promise<void>;
  isLoading: boolean;
};

/**
 * Value exposed by the I18nContext to components.
 */
export type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, values?: TranslationValues) => string;
};

// ============================================================================
// I18N
// ============================================================================

/**
 * Supported locale codes.
 */
export type Locale = "it" | "en" | "uk";

/**
 * Values for template interpolation in translations.
 */
export type TranslationValues = Record<string, string | number>;
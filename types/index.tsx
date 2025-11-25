// Shared type definitions for dashboard appointments.
// Allows `form.tsx`, `list.tsx` and `list-item.tsx` to exchange data consistently.

// Appointment categories supported by both the form and the list.
// Can be extended in the future without touching components.
export type AppointmentCategory = "sleep" | "other";

// Represents a single scheduled appointment
export type Appointment = {
  // Unique identifier used as the `key` within lists
  id: string;
  // Start time in HH:mm format
  startTime: string;
  // End time in HH:mm format
  endTime: string;
  // Appointment category (sleep, other, etc.)
  category: AppointmentCategory;
  // Free-text description entered by the user
  description?: string;
  // Whether the appointment is recurring
  isRepeating: boolean;
  // Selected weekdays for the recurrence (1-7)
  repeatDays: DayId[];
};

// Payload emitted by the form to create a new appointment (without the id).
export type AppointmentFormData = Omit<Appointment, "id">;

// Day identifiers used for recurrence: 1-7 = Mon-Sun
export type DayId = "1" | "2" | "3" | "4" | "5" | "6" | "7";

// Shared map from day id to human-friendly label
export const DAY_LABELS: Record<DayId, string> = {
  "1": "Lunedì",
  "2": "Martedì",
  "3": "Mercoledì",
  "4": "Giovedì",
  "5": "Venerdì",
  "6": "Sabato",
  "7": "Domenica",
};

// Human-friendly labels for each appointment category
export const APPOINTMENT_CATEGORY_LABEL: Record<AppointmentCategory, string> = {
  sleep: "Sonno",
  other: "Altro",
};

// Human-friendly description of the recurrence or null when non-recurring.
export function formatRepeatLabel(
  isRepeating: boolean,
  repeatDays: DayId[]
): string | null {
  if (!isRepeating) return null;

  if (repeatDays.length === 0) {
    return "Impegno ricorrente (giorni non selezionati)";
  }

  const labels = repeatDays.map((d) => DAY_LABELS[d] ?? d);
  return `Ripete: ${labels.join(", ")}`;
}


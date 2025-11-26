import {
  formatTimeTo24h,
  parseTimeStrict,
} from "@/lib/time/dayjs";
import {
  Appointment,
  AppointmentFormData,
  AppointmentFormState,
  AppointmentValidationResult,
} from "@/types";

// ============================================================================
// BUSINESS LOGIC - Pure functions (no side effects)
// ============================================================================

const defaultIdFactory = () => Date.now().toString();

/**
 * Normalizes the raw form state into a clean AppointmentFormData object.
 * Components call this helper so that trimming/guards live outside the UI.
 * Converts 00:00 end time to 24:00 when start time is after 12:00 (represents end of day).
 */
export function buildAppointmentFormData(
  state: AppointmentFormState
): AppointmentFormData {
  let endTime = formatTimeTo24h(state.endTime);
  
  // Convert 00:00 to 24:00 when start time is after 12:00 (represents end of day)
  if (endTime === "00:00") {
    const start = parseTimeStrict(state.startTime);
    if (start.isValid() && start.hour() >= 12) {
      endTime = "24:00";
    }
  }

  return {
    startTime: formatTimeTo24h(state.startTime),
    endTime,
    category: state.category,
    description: state.description?.trim() || undefined,
    isRepeating: state.isRepeating,
    repeatDays: state.repeatDays,
  };
}

/**
 * Creates a full Appointment entity by attaching an id to AppointmentFormData.
 * The idFactory is injectable to keep this helper pure and easy to test.
 */
export function createAppointment(
  data: AppointmentFormData,
  idFactory: () => string = defaultIdFactory
): Appointment {
  return {
    id: idFactory(),
    ...data,
  };
}

/**
 * Validates that the appointment times follow 24h format and do not overlap
 * with existing appointments already stored for the user.
 */
export function validateAppointmentSlot(
  data: AppointmentFormData,
  existing: Appointment[]
): AppointmentValidationResult {
  const start = parseTimeStrict(data.startTime);
  const end = parseTimeStrict(data.endTime);

  if (!start.isValid() || !end.isValid()) {
    return {
      ok: false,
      reason: "invalid-format",
    };
  }

  if (!start.isBefore(end)) {
    return {
      ok: false,
      reason: "end-before-start",
    };
  }

  const overlaps = existing.some((appointment) => {
    const appointmentStart = parseTimeStrict(appointment.startTime);
    const appointmentEnd = parseTimeStrict(appointment.endTime);

    if (!appointmentStart.isValid() || !appointmentEnd.isValid()) {
      return false;
    }

    const startsDuringExisting = start.isBefore(appointmentEnd);
    const endsAfterExistingStarts = end.isAfter(appointmentStart);

    return startsDuringExisting && endsAfterExistingStarts;
  });

  if (overlaps) {
    return {
      ok: false,
      reason: "overlap",
    };
  }

  return { ok: true };
}

// ============================================================================
// CLIENT-SIDE API - HTTP calls from browser to API routes
// ============================================================================
// These functions use fetch() to call Next.js API routes.
// They run ONLY in the browser (client-side) and cannot access the database directly.
// Flow: Browser → fetch() → API Route → Server DB functions → Database

/**
 * Fetches all appointments for a specific user and date via API route.
 * Called from browser → calls GET /api/appointments → which uses listAppointmentsFromDb()
 * @param userId - The user ID to fetch appointments for
 * @param date - Optional date in YYYY-MM-DD format (defaults to today)
 * @returns Promise resolving to an array of appointments
 * @throws Error if the request fails
 */
export async function fetchAppointments(
  userId: number,
  date?: string
): Promise<Appointment[]> {
  const params = new URLSearchParams({ userId: String(userId) });
  if (date) {
    params.append("date", date);
  }

  const response = await fetch(`/api/appointments?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load appointments");
  }

  const payload = (await response.json()) as { appointments: Appointment[] };
  return payload.appointments;
}

/**
 * Saves a new appointment via API route.
 * Called from browser → calls POST /api/appointments/add → which uses createAppointmentInDb()
 * @param userId - The user ID to create the appointment for
 * @param appointment - The appointment data to save
 * @returns Promise that resolves when the appointment is saved
 * @throws Error if the request fails
 */
export async function saveAppointment(
  userId: number,
  appointment: Appointment
): Promise<void> {
  const response = await fetch(`/api/appointments/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, appointment }),
  });

  if (!response.ok) {
    throw new Error("Failed to save appointment");
  }
}

/**
 * Removes an appointment via API route.
 * Called from browser → calls POST /api/appointments/remove → which uses deleteAppointmentFromDb()
 * @param userId - The user ID that owns the appointment
 * @param appointmentId - The ID of the appointment to remove
 * @returns Promise that resolves when the appointment is removed
 * @throws Error if the request fails
 */
export async function removeAppointment(
  userId: number,
  appointmentId: string
): Promise<void> {
  const response = await fetch(`/api/appointments/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, appointmentId }),
  });

  if (!response.ok) {
    throw new Error("Failed to remove appointment");
  }
}

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
import {
  wouldOverlap,
  validateTimeFormat,
  validateTimeOrder,
} from "./appointments-time-validation.service";

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
 * Uses unified validation functions from time-utils service.
 */
export function validateAppointmentSlot(
  data: AppointmentFormData,
  existing: Appointment[]
): AppointmentValidationResult {
  // Validate format
  const startFormat = validateTimeFormat(data.startTime);
  const endFormat = validateTimeFormat(data.endTime);

  if (!startFormat.valid || !endFormat.valid) {
    return {
      ok: false,
      reason: "invalid-format",
    };
  }

  // Validate order (end after start)
  const orderValidation = validateTimeOrder(data.startTime, data.endTime);
  if (!orderValidation.valid) {
    return {
      ok: false,
      reason: "end-before-start",
    };
  }

  // Check for overlap using unified function
  if (wouldOverlap(data.startTime, data.endTime, existing)) {
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
 * Fetches appointments for multiple users in parallel via batch API route.
 * Optimized endpoint that loads appointments for all users in a single request.
 * Called from browser → calls GET /api/appointments/batch → which uses listAppointmentsBatchFromDb()
 * @param userIds - Array of user IDs to fetch appointments for
 * @param date - Optional date in YYYY-MM-DD format (defaults to today)
 * @returns Promise resolving to a map of userId to appointments array
 * @throws Error if the request fails
 */
export async function fetchAppointmentsBatch(
  userIds: number[],
  date?: string
): Promise<Record<number, Appointment[]>> {
  if (userIds.length === 0) {
    return {};
  }

  const params = new URLSearchParams({
    userIds: userIds.join(","),
  });
  if (date) {
    params.append("date", date);
  }

  const response = await fetch(`/api/appointments/batch?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load appointments batch");
  }

  const payload = (await response.json()) as {
    appointmentsByUser: Record<number, Appointment[]>;
  };
  return payload.appointmentsByUser;
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

/**
 * Fetches all recurring appointment templates for a specific user via API route.
 * Returns all recurring templates, not filtered by date.
 * @param userId - The user ID to fetch recurring templates for
 * @returns Promise resolving to an array of recurring appointment templates
 * @throws Error if the request fails
 */
export async function fetchRecurringTemplates(
  userId: number
): Promise<Appointment[]> {
  const params = new URLSearchParams({ userId: String(userId) });

  const response = await fetch(`/api/appointments/recurring?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load recurring templates");
  }

  const payload = (await response.json()) as { recurringTemplates: Appointment[] };
  return payload.recurringTemplates;
}

/**
 * Updates an appointment via API route.
 * Called from browser → calls PUT /api/appointments/update → which uses updateAppointmentInDb()
 * @param userId - The user ID that owns the appointment
 * @param appointmentId - The ID of the appointment to update
 * @param appointment - The updated appointment data
 * @returns Promise that resolves when the appointment is updated
 * @throws Error if the request fails
 */
export async function updateAppointment(
  userId: number,
  appointmentId: string,
  appointment: Appointment
): Promise<void> {
  const response = await fetch(`/api/appointments/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, appointmentId, appointment }),
  });

  if (!response.ok) {
    throw new Error("Failed to update appointment");
  }
}

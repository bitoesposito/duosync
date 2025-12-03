import {
  formatTimeTo24h,
  parseTimeStrict,
} from "@/lib/time/dayjs";
import {
  Appointment,
  AppointmentFormData,
  AppointmentFormState,
  AppointmentValidationResult,
  DayId,
  RecurringAppointmentForValidation,
  OneTimeAppointmentForValidation,
} from "@/types";
import {
  wouldOverlap,
  validateTimeFormat,
  validateTimeOrder,
  timeToMinutes,
} from "./appointments-time-validation.service";

// ============================================================================
// BUSINESS LOGIC - Pure functions (no side effects)
// ============================================================================

const defaultIdFactory = () => Date.now().toString();

/**
 * Sorts repeatDays array in logical order (1-7, Monday to Sunday).
 * Ensures consistent display and storage of repeat days.
 * @param repeatDays - Array of day IDs to sort
 * @returns Sorted array of day IDs in ascending order (1-7)
 */
export function sortRepeatDays(repeatDays: DayId[]): DayId[] {
  return [...repeatDays].sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    return numA - numB;
  });
}

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
    repeatDays: state.repeatDays.length > 0 ? sortRepeatDays(state.repeatDays) : [],
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
 * Validates that a recurring appointment doesn't overlap with existing recurring appointments
 * on the same days of the week. Only checks for overlaps on days that are common between
 * the new appointment and existing recurring appointments.
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @param repeatDays - Days of the week for the new recurring appointment
 * @param recurringAppointments - Existing recurring appointments to check against
 * @param oneTimeAppointments - One-time appointments on the specified days
 * @returns True if there's an overlap, false otherwise
 */
function wouldRecurringOverlap(
  startTime: string,
  endTime: string,
  repeatDays: DayId[],
  recurringAppointments: RecurringAppointmentForValidation[],
  oneTimeAppointments: OneTimeAppointmentForValidation[]
): boolean {
  // Handle 00:00 as 23:59 when start is after 12:00, and convert 24:00 to 23:59
  let normalizedEndTime = endTime;
  if (endTime === "24:00") {
    normalizedEndTime = "23:59";
  } else if (endTime === "00:00" && parseTimeStrict(startTime).hour() >= 12) {
    normalizedEndTime = "23:59";
  }

  // Check overlap with one-time appointments on the same days
  const relevantOneTime = oneTimeAppointments.filter((apt) =>
    repeatDays.includes(apt.dayOfWeek)
  );
  
  if (relevantOneTime.length > 0) {
    const oneTimeOverlaps = relevantOneTime.some((apt) => {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(normalizedEndTime);
      const aptStartMinutes = timeToMinutes(apt.startTime);
      const aptEndMinutes = timeToMinutes(apt.endTime);
      return startMinutes < aptEndMinutes && endMinutes > aptStartMinutes;
    });
    if (oneTimeOverlaps) return true;
  }

  // Check overlap with recurring appointments that share at least one day
  return recurringAppointments.some((existing) => {
    // Check if there's any day overlap
    const hasDayOverlap = repeatDays.some((day) =>
      existing.repeatDays.includes(day)
    );
    
    if (!hasDayOverlap) {
      // No day overlap, so no conflict
      return false;
    }

    // Normalize existing endTime as well
    let normalizedExistingEndTime = existing.endTime;
    if (existing.endTime === "24:00") {
      normalizedExistingEndTime = "23:59";
    } else if (existing.endTime === "00:00" && parseTimeStrict(existing.startTime).hour() >= 12) {
      normalizedExistingEndTime = "23:59";
    }

    // Check time overlap
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(normalizedEndTime);
    const existingStartMinutes = timeToMinutes(existing.startTime);
    const existingEndMinutes = timeToMinutes(normalizedExistingEndTime);
    
    return startMinutes < existingEndMinutes && endMinutes > existingStartMinutes;
  });
}


/**
 * Validates that the appointment times follow 24h format and do not overlap
 * with existing appointments already stored for the user.
 * Uses unified validation functions from time-utils service.
 * 
 * For recurring appointments, this function should be called with the result of
 * fetchAppointmentsForValidation() to properly check overlaps across all selected days.
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

/**
 * Validates a recurring appointment by checking for overlaps with existing
 * recurring appointments and one-time appointments on the selected days.
 * This function properly considers that recurring appointments only apply
 * on specific days of the week.
 * @param data - The appointment form data to validate
 * @param recurringAppointments - Existing recurring appointments
 * @param oneTimeAppointments - One-time appointments on the selected days
 * @returns Validation result
 */
export function validateRecurringAppointmentSlot(
  data: AppointmentFormData,
  recurringAppointments: RecurringAppointmentForValidation[],
  oneTimeAppointments: OneTimeAppointmentForValidation[]
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

  // Validate that repeatDays is not empty
  if (!data.isRepeating || data.repeatDays.length === 0) {
    return {
      ok: false,
      reason: "invalid-format",
    };
  }

  // Check for overlap with recurring appointments and one-time appointments
  if (
    wouldRecurringOverlap(
      data.startTime,
      data.endTime,
      data.repeatDays,
      recurringAppointments,
      oneTimeAppointments
    )
  ) {
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

/**
 * Fetches appointments for validation purposes when creating/editing recurring appointments.
 * Returns all recurring appointments and one-time appointments that fall on the specified days.
 * Called from browser → calls GET /api/appointments/validation → which uses getAllAppointmentsForValidation()
 * @param userId - The user ID to fetch appointments for
 * @param daysToCheck - Array of day IDs (1-7) to check for one-time appointments
 * @returns Promise resolving to recurring and one-time appointments for validation
 * @throws Error if the request fails
 */
export async function fetchAppointmentsForValidation(
  userId: number,
  daysToCheck: DayId[]
): Promise<{
  recurringAppointments: RecurringAppointmentForValidation[];
  oneTimeAppointments: OneTimeAppointmentForValidation[];
}> {
  const params = new URLSearchParams({
    userId: String(userId),
    days: daysToCheck.join(","),
  });

  const response = await fetch(`/api/appointments/validation?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load appointments for validation");
  }

  const payload = (await response.json()) as {
    recurringAppointments: RecurringAppointmentForValidation[];
    oneTimeAppointments: OneTimeAppointmentForValidation[];
  };
  return payload;
}

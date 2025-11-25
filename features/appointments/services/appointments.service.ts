import {
  formatTimeTo24h,
  parseTimeStrict,
} from "@/lib/time/dayjs";
import {
  Appointment,
  AppointmentCategory,
  AppointmentFormData,
  DayId,
} from "@/types";

type AppointmentFormState = {
  startTime: string;
  endTime: string;
  category: AppointmentCategory;
  description?: string;
  isRepeating: boolean;
  repeatDays: DayId[];
};

const defaultIdFactory = () => Date.now().toString();

/**
 * Normalizes the raw form state into a clean AppointmentFormData object.
 * Components call this helper so that trimming/guards live outside the UI.
 */
export function buildAppointmentFormData(
  state: AppointmentFormState
): AppointmentFormData {
  return {
    startTime: formatTimeTo24h(state.startTime),
    endTime: formatTimeTo24h(state.endTime),
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

export type AppointmentValidationResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid-format" | "end-before-start" | "overlap";
    };

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




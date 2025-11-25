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
    startTime: state.startTime,
    endTime: state.endTime,
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



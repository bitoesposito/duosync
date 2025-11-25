"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
  useContext,
} from "react";
import { Appointment, AppointmentFormData } from "@/types";
import { createAppointment } from "./services/appointments.service";

// Value exposed to components that need to read/write appointments.
export type AppointmentsContextValue = {
  appointments: Appointment[];
  addAppointment: (data: AppointmentFormData) => void;
  removeAppointment: (id: string) => void;
};

const AppointmentsContext = createContext<AppointmentsContextValue | undefined>(
  undefined
);

// Provider responsible for storing the appointments list for the dashboard.
export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const addAppointment = useCallback((data: AppointmentFormData) => {
    setAppointments((prev) => [...prev, createAppointment(data)]);
  }, []);

  const removeAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
  }, []);

  const value = useMemo<AppointmentsContextValue>(
    () => ({
      appointments,
      addAppointment,
      removeAppointment,
    }),
    [appointments, addAppointment, removeAppointment]
  );

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  );
}

// Internal hook to access the context. Public components should use useAppointments.
export function useAppointmentsContext() {
  const ctx = useContext(AppointmentsContext);

  if (!ctx) {
    throw new Error(
      "useAppointments deve essere usato all'interno di <AppointmentsProvider>"
    );
  }

  return ctx;
}



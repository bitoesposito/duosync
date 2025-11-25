"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Appointment, AppointmentFormData } from "@/types";
import {
  createAppointment,
  validateAppointmentSlot,
} from "./services/appointments.service";
import { useUsersContext } from "@/features/users";
import { useI18nContext } from "@/i18n";

// Value exposed to components that need to read/write appointments.
export type AppointmentsContextValue = {
  appointments: Appointment[];
  addAppointment: (data: AppointmentFormData) => void;
  removeAppointment: (id: string) => void;
  isLoading: boolean;
  isSaving: boolean;
};

const AppointmentsContext = createContext<AppointmentsContextValue | undefined>(
  undefined
);

async function fetchAppointments(userId: number) {
  const response = await fetch(`/api/appointments?userId=${userId}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Impossibile caricare gli impegni");
  }
  const payload = (await response.json()) as { appointments: Appointment[] };
  return payload.appointments;
}

async function addAppointmentRemote(userId: number, appointment: Appointment) {
  const response = await fetch(`/api/appointments/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, appointment }),
  });
  if (!response.ok) {
    throw new Error("Impossibile salvare l'impegno");
  }
}

async function removeAppointmentRemote(userId: number, appointmentId: string) {
  const response = await fetch(`/api/appointments/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, appointmentId }),
  });
  if (!response.ok) {
    throw new Error("Impossibile eliminare l'impegno");
  }
}

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const { activeUser } = useUsersContext();
  const { t } = useI18nContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<number | null>(null);
  const [pendingMutations, setPendingMutations] = useState(0);
  const isSaving = pendingMutations > 0;
  const isLoading =
    typeof activeUser?.id === "number" && activeUser.id !== loadedUserId;

  useEffect(() => {
    if (!activeUser?.id) {
      return;
    }
    let cancelled = false;

    fetchAppointments(activeUser.id)
      .then((data) => {
        if (!cancelled) {
          setAppointments(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAppointments([]);
          toast.error(t("toasts.loadError.title"), {
            description: t("toasts.loadError.description"),
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadedUserId(activeUser.id);
      });

    return () => {
      cancelled = true;
    };
  }, [activeUser?.id, t]);

  const addAppointment = useCallback(
    (data: AppointmentFormData) => {
      if (!activeUser) {
        toast.warning(t("toasts.selectUser.title"), {
          description: t("toasts.selectUser.description"),
        });
        return;
      }
      let validationError:
        | ReturnType<typeof validateAppointmentSlot>
        | undefined;
      let appointment: Appointment | undefined;
      setAppointments((prev) => {
        const validation = validateAppointmentSlot(data, prev);
        if (!validation.ok) {
          validationError = validation;
          return prev;
        }
        appointment = createAppointment(data);
        return [...prev, appointment];
      });

      if (validationError && !validationError.ok) {
        const reasonKeyMap = {
          "invalid-format": "toasts.invalidSlot.descriptionInvalidFormat",
          "end-before-start": "toasts.invalidSlot.descriptionEndBeforeStart",
          overlap: "toasts.invalidSlot.descriptionOverlap",
        } as const;
        const descriptionKey = reasonKeyMap[validationError.reason];
        toast.warning(t("toasts.invalidSlot.title"), {
          description: t(descriptionKey),
        });
        return;
      }

      if (!appointment) {
        return;
      }

      setPendingMutations((count) => count + 1);
      addAppointmentRemote(activeUser.id, appointment)
        .then(() => {
          toast.success(t("toasts.saveSuccess.title"), {
            description: t("toasts.saveSuccess.description", {
              start: appointment!.startTime,
              end: appointment!.endTime,
            }),
          });
        })
        .catch((error) => {
          console.error("Impossibile salvare l'impegno", error);
          toast.error(t("toasts.saveError.title"), {
            description: t("toasts.saveError.description"),
          });
          setAppointments((prev) =>
            prev.filter((item) => item.id !== appointment!.id)
          );
        })
        .finally(() => {
          setPendingMutations((count) => Math.max(0, count - 1));
        });
    },
    [activeUser, t]
  );

  const removeAppointment = useCallback(
    (id: string) => {
      if (!activeUser) {
        toast.warning(t("toasts.selectUser.title"), {
          description: t("toasts.selectUser.description"),
        });
        return;
      }
      let removed: Appointment | undefined;
      let removedIndex = -1;
      setAppointments((prev) => {
        removedIndex = prev.findIndex((appointment) => appointment.id === id);
        if (removedIndex === -1) {
          return prev;
        }
        removed = prev[removedIndex];
        const next = [...prev];
        next.splice(removedIndex, 1);
        return next;
      });
      setPendingMutations((count) => count + 1);
      removeAppointmentRemote(activeUser.id, id)
        .then(() => {
          toast.success(t("toasts.deleteSuccess.title"));
        })
        .catch((error) => {
          console.error("Impossibile eliminare l'impegno", error);
          toast.error(t("toasts.deleteError.title"), {
            description: t("toasts.deleteError.description"),
          });
          if (!removed) return;
          setAppointments((prev) => {
            const next = [...prev];
            const safeIndex =
              removedIndex >= 0 && removedIndex <= next.length
                ? removedIndex
                : next.length;
            next.splice(safeIndex, 0, removed!);
            return next;
          });
        })
        .finally(() => {
          setPendingMutations((count) => Math.max(0, count - 1));
        });
    },
    [activeUser, t]
  );

  const value = useMemo<AppointmentsContextValue>(
    () => ({
      appointments,
      addAppointment,
      removeAppointment,
      isLoading,
      isSaving,
    }),
    [appointments, addAppointment, removeAppointment, isLoading, isSaving]
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
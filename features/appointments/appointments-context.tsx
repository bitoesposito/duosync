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
import {
  Appointment,
  AppointmentFormData,
  AppointmentsContextValue,
} from "@/types";
import {
  createAppointment,
  validateAppointmentSlot,
  fetchAppointments,
  saveAppointment,
  updateAppointment as updateAppointmentApi,
  removeAppointment as removeAppointmentApi,
} from "./services/appointments.service";
import { useUsers } from "@/features/users";
import { useI18n } from "@/i18n";

const AppointmentsContext = createContext<AppointmentsContextValue | undefined>(
  undefined
);

/**
 * Provider component that manages appointments state for the active user.
 * Handles fetching, creating, and deleting appointments via API services.
 * The context is keyed by user ID to reset state when switching users.
 */
export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const { activeUser } = useUsers();
  const { t } = useI18n();
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
      .catch((error) => {
        if (!cancelled) {
          console.error("Error loading appointments:", error);
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
      saveAppointment(activeUser.id, appointment)
        .then(() => {
          toast.success(t("toasts.saveSuccess.title"), {
            description: t("toasts.saveSuccess.description", {
              start: appointment!.startTime,
              end: appointment!.endTime,
            }),
          });
        })
        .catch((error: unknown) => {
          console.error("Failed to save appointment:", error);
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

  const updateAppointment = useCallback(
    async (id: string, updatedAppointment: Appointment) => {
      if (!activeUser) {
        toast.warning(t("toasts.selectUser.title"), {
          description: t("toasts.selectUser.description"),
        });
        return;
      }
      
      // Optimistic update
      let originalAppointment: Appointment | undefined;
      setAppointments((prev) => {
        const index = prev.findIndex((appointment) => appointment.id === id);
        if (index === -1) {
          return prev;
        }
        originalAppointment = prev[index];
        const next = [...prev];
        next[index] = updatedAppointment;
        return next;
      });
      
      setPendingMutations((count) => count + 1);
      
      try {
        await updateAppointmentApi(activeUser.id, id, updatedAppointment);
        toast.success(t("toasts.updateSuccess.title") || t("admin.users.appointments.updateSuccess"));
        // Reload appointments from database to ensure consistency
        const updatedAppointments = await fetchAppointments(activeUser.id);
        setAppointments(updatedAppointments);
      } catch (error: unknown) {
        console.error("Failed to update appointment:", error);
        toast.error(t("toasts.updateError.title") || t("admin.users.appointments.updateError"));
        // Revert optimistic update
        if (originalAppointment) {
          setAppointments((prev) => {
            const next = [...prev];
            const index = next.findIndex((appointment) => appointment.id === id);
            if (index !== -1) {
              next[index] = originalAppointment!;
            }
            return next;
          });
        }
      } finally {
        setPendingMutations((count) => Math.max(0, count - 1));
      }
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
      removeAppointmentApi(activeUser.id, id)
        .then(() => {
          toast.success(t("toasts.deleteSuccess.title"));
          // Reload appointments from database to ensure consistency
          // This is especially important for recurring appointments where we only remove a day
          return fetchAppointments(activeUser.id);
        })
        .then((updatedAppointments) => {
          setAppointments(updatedAppointments);
        })
        .catch((error: unknown) => {
          console.error("Failed to delete appointment:", error);
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
      updateAppointment,
      removeAppointment,
      isLoading,
      isSaving,
    }),
    [appointments, addAppointment, updateAppointment, removeAppointment, isLoading, isSaving]
  );

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  );
}

/**
 * Hook to access the appointments context.
 * Exported as useAppointments from the feature's public API.
 */
export function useAppointmentsContext() {
  const ctx = useContext(AppointmentsContext);

  if (!ctx) {
    throw new Error(
      "useAppointmentsContext must be used within <AppointmentsProvider>"
    );
  }

  return ctx;
}
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
  fetchAppointmentsBatch,
  fetchRecurringTemplates,
  saveAppointment,
  updateAppointment as updateAppointmentApi,
  removeAppointment as removeAppointmentApi,
} from "./services/appointments.service";
import { useUsers } from "@/features/users";
import { useI18n } from "@/i18n";
import { usePWAPrompt } from "@/features/pwa/pwa-prompt-context";

const AppointmentsContext = createContext<AppointmentsContextValue | undefined>(
  undefined
);

/**
 * Provider component that manages appointments state for the active user.
 * Handles fetching, creating, and deleting appointments via API services.
 * The context is keyed by user ID to reset state when switching users.
 */
export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const { activeUser, users } = useUsers();
  const { t } = useI18n();
  const { showInstallPrompt } = usePWAPrompt();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<Appointment[]>([]);
  const [otherUserAppointments, setOtherUserAppointments] = useState<Appointment[] | undefined>(undefined);
  const [allOtherUsersAppointments, setAllOtherUsersAppointments] = useState<Record<number, Appointment[]> | undefined>(undefined);
  const [loadedUserId, setLoadedUserId] = useState<number | null>(null);
  const [pendingMutations, setPendingMutations] = useState(0);
  const isSaving = pendingMutations > 0;
  const isLoading =
    typeof activeUser?.id === "number" && activeUser.id !== loadedUserId;
  
  // Track if we're currently fetching to help other components know when data is being loaded
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!activeUser?.id) {
      setAppointments([]);
      setRecurringTemplates([]);
      setOtherUserAppointments(undefined);
      setAllOtherUsersAppointments(undefined);
      setLoadedUserId(null);
      return;
    }
    let cancelled = false;
    setIsFetching(true);

    // Reset state when user changes to avoid showing stale data
    const otherUsers = users.filter((u) => u.id !== activeUser.id);
    
    // Reset appointments and templates immediately
    setAppointments([]);
    setRecurringTemplates([]);
    
    // Only reset otherUserAppointments/allOtherUsersAppointments if there are no other users
    // If there are other users, keep the old value until new data arrives
    // This prevents the hook from doing an unnecessary individual fetch
    if (otherUsers.length === 0) {
      setOtherUserAppointments(undefined);
      setAllOtherUsersAppointments(undefined);
    }
    
    // Load active appointments for today and all recurring templates in parallel
    // Fetch active appointments (for today) - include all users
    const allUserIds = [activeUser.id, ...otherUsers.map((u) => u.id)];
    const activeAppointmentsPromise = allUserIds.length > 1
      ? fetchAppointmentsBatch(allUserIds).then((data) => {
          if (!cancelled) {
            setAppointments(data[activeUser.id] || []);
            // Store all other users' appointments in the new structure
            const otherUsersData: Record<number, Appointment[]> = {};
            otherUsers.forEach((user) => {
              otherUsersData[user.id] = data[user.id] || [];
            });
            setAllOtherUsersAppointments(otherUsersData);
            // Keep backward compatibility: set otherUserAppointments for the first other user
            if (otherUsers.length > 0) {
              setOtherUserAppointments(data[otherUsers[0].id] || []);
            } else {
              setOtherUserAppointments(undefined);
            }
          }
        })
      : fetchAppointments(activeUser.id).then((data) => {
          if (!cancelled) {
            setAppointments(data);
            setOtherUserAppointments(undefined);
            setAllOtherUsersAppointments(undefined);
          }
        });

    // Fetch all recurring templates (not filtered by date)
    const recurringTemplatesPromise = fetchRecurringTemplates(activeUser.id).then((data) => {
      if (!cancelled) {
        setRecurringTemplates(data);
      }
    });

    // Wait for both to complete
    Promise.all([activeAppointmentsPromise, recurringTemplatesPromise])
      .catch((error) => {
        if (!cancelled) {
          console.error("Error loading appointments:", error);
          setAppointments([]);
          setRecurringTemplates([]);
          setOtherUserAppointments(undefined);
          setAllOtherUsersAppointments(undefined);
          toast.error(t("toasts.loadError.title"), {
            description: t("toasts.loadError.description"),
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadedUserId(activeUser.id);
          setIsFetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeUser?.id, users, t]);

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
      let wasFirstAppointment = false;
      setAppointments((prev) => {
        // Check if this is the first appointment
        wasFirstAppointment = prev.length === 0;
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
      const appointmentToSave = appointment;
      saveAppointment(activeUser.id, appointmentToSave)
        .then(() => {
          toast.success(t("toasts.saveSuccess.title"), {
            description: t("toasts.saveSuccess.description", {
              start: appointmentToSave.startTime,
              end: appointmentToSave.endTime,
            }),
          });
          // Show install prompt after first appointment is created
          if (wasFirstAppointment) {
            // Small delay to let the success toast appear first
            setTimeout(() => {
              showInstallPrompt();
            }, 500);
          }
          // If it's a recurring appointment, reload recurring templates
          if (appointmentToSave.isRepeating) {
            return fetchRecurringTemplates(activeUser.id).then((templates) => {
              setRecurringTemplates(templates);
            });
          }
        })
        .catch((error: unknown) => {
          console.error("Failed to save appointment:", error);
          toast.error(t("toasts.saveError.title"), {
            description: t("toasts.saveError.description"),
          });
          setAppointments((prev) =>
            prev.filter((item) => item.id !== appointmentToSave.id)
          );
        })
        .finally(() => {
          setPendingMutations((count) => Math.max(0, count - 1));
        });
    },
    [activeUser, t, showInstallPrompt]
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
        // Reload appointments and recurring templates from database to ensure consistency
        const [updatedAppointments, updatedTemplates] = await Promise.all([
          fetchAppointments(activeUser.id),
          fetchRecurringTemplates(activeUser.id),
        ]);
        setAppointments(updatedAppointments);
        setRecurringTemplates(updatedTemplates);
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
          // Reload appointments and recurring templates from database to ensure consistency
          // This is especially important for recurring appointments where we only remove a day
          return Promise.all([
            fetchAppointments(activeUser.id),
            fetchRecurringTemplates(activeUser.id),
          ]);
        })
        .then(([updatedAppointments, updatedTemplates]) => {
          setAppointments(updatedAppointments);
          setRecurringTemplates(updatedTemplates);
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
      recurringTemplates,
      otherUserAppointments,
      allOtherUsersAppointments,
      addAppointment,
      updateAppointment,
      removeAppointment,
      isLoading,
      isSaving,
      isFetching,
    }),
    [appointments, recurringTemplates, otherUserAppointments, allOtherUsersAppointments, addAppointment, updateAppointment, removeAppointment, isLoading, isSaving, isFetching]
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
import { useEffect, useState } from "react";
import { useAppointments, fetchAppointments } from "@/features/appointments";
import { Appointment } from "@/types";

/**
 * Hook to fetch and manage the other user's appointments.
 * Used by availability grid to compare availability between users.
 * 
 * Optimized: Uses appointments from context if available (from batch fetch),
 * otherwise falls back to individual fetch.
 */
export function useOtherUserAppointments(otherUserId: number | undefined) {
  const { otherUserAppointments, isLoading: isLoadingContext } = useAppointments();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!otherUserId) {
      setAppointments([]);
      return;
    }

    // If appointments are available from context (batch fetch), use them
    if (otherUserAppointments !== undefined) {
      setAppointments(otherUserAppointments);
      return;
    }

    // Otherwise, fetch individually (fallback for edge cases)
    let cancelled = false;
    setIsLoading(true);

    fetchAppointments(otherUserId)
      .then((data) => {
        if (!cancelled) {
          setAppointments(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Error loading other user appointments:", error);
          setAppointments([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [otherUserId, otherUserAppointments]);

  // Loading state: true if context is loading OR if we're doing individual fetch
  const isLoadingCombined = isLoadingContext || isLoading;

  return { appointments, isLoading: isLoadingCombined };
}


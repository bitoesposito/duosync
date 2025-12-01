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
  const { otherUserAppointments, isLoading: isLoadingContext, isFetching } = useAppointments();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!otherUserId) {
      setAppointments([]);
      setIsLoading(false);
      return;
    }

    // If appointments are available from context (batch fetch), use them
    // Check for both undefined (not loaded yet) and empty array (loaded but empty)
    if (otherUserAppointments !== undefined) {
      setAppointments(otherUserAppointments);
      setIsLoading(false);
      return;
    }

    // If context is still loading or fetching, wait for it
    // This prevents unnecessary individual fetch when batch is in progress
    if (isLoadingContext || isFetching) {
      setIsLoading(true);
      return;
    }

    // Context is not loading/fetching but otherUserAppointments is undefined
    // This means batch fetch didn't include this user or failed
    // Fetch individually as fallback
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
  }, [otherUserId, otherUserAppointments, isLoadingContext, isFetching]);

  // Loading state: true if context is loading/fetching OR if we're doing individual fetch
  const isLoadingCombined = isLoadingContext || isFetching || isLoading;

  return { appointments, isLoading: isLoadingCombined };
}


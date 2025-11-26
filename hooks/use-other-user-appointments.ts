import { useEffect, useState } from "react";
import { fetchAppointments } from "@/features/appointments";
import { Appointment } from "@/types";

/**
 * Hook to fetch and manage the other user's appointments.
 * Used by availability grid to compare availability between users.
 */
export function useOtherUserAppointments(otherUserId: number | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!otherUserId) {
      setAppointments([]);
      return;
    }

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
  }, [otherUserId]);

  return { appointments, isLoading };
}


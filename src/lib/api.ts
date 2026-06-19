import type { AppointmentInput, DayAppointment, UserProfile } from "@shared";

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let reason = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) reason = body.error;
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new Error(reason);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type AppointmentPayload = AppointmentInput & { id?: string };

export const api = {
  listUsers: () => http<UserProfile[]>("/api/users"),

  listAppointments: (date: string) =>
    http<Record<number, DayAppointment[]>>(`/api/appointments?date=${date}`),

  upsertAppointment: (userId: number, appointment: AppointmentPayload, date?: string) =>
    http<{ id: string; isRepeating: boolean }>("/api/appointments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, date, appointment }),
    }),

  deleteAppointment: (id: string, isRepeating: boolean) =>
    http<void>(
      `/api/appointments?id=${encodeURIComponent(id)}&isRepeating=${isRepeating}`,
      { method: "DELETE" },
    ),
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type AppointmentPayload } from "@/lib/api";
import { useUsers } from "@/features/users/useUsers";
import type { AppointmentInput, DayAppointment } from "@shared";

type Batch = Record<number, DayAppointment[]>;
const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Today's appointments for the active user (one-time + expanded recurring) plus
 * every other user's, with create/update/delete. Mirrors the legacy context API.
 */
export function useAppointments() {
  const qc = useQueryClient();
  const { activeUser } = useUsers();
  const date = todayISO();
  const uid = activeUser?.id ?? null;
  const key = ["appointments", date] as const;

  const query = useQuery({ queryKey: key, queryFn: () => api.listAppointments(date) });
  const batch = query.data;

  const appointments = uid != null ? (batch?.[uid] ?? []) : [];
  const allOtherUsersAppointments: Batch = {};
  if (batch) {
    for (const [k, v] of Object.entries(batch)) {
      if (Number(k) !== uid) allOtherUsersAppointments[Number(k)] = v;
    }
  }

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const upsert = useMutation({
    mutationFn: (appointment: AppointmentPayload) =>
      api.upsertAppointment(uid as number, appointment, date),
    onSettled: invalidate,
  });

  const del = useMutation({
    mutationFn: (vars: { id: string; isRepeating: boolean; templateId?: string }) =>
      api.deleteAppointment(vars.templateId ?? vars.id, vars.isRepeating),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Batch>(key);
      if (previous) {
        const next: Batch = {};
        for (const [k, list] of Object.entries(previous)) {
          next[Number(k)] = list.filter((a) => a.id !== vars.id);
        }
        qc.setQueryData(key, next);
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: invalidate,
  });

  return {
    appointments,
    allOtherUsersAppointments,
    addAppointment: (data: AppointmentInput) => upsert.mutateAsync(data),
    updateAppointment: (id: string, data: AppointmentInput) => upsert.mutateAsync({ ...data, id }),
    removeAppointment: (id: string, isRepeating: boolean, templateId?: string) =>
      del.mutate({ id, isRepeating, templateId }),
    isLoading: query.isLoading,
    isSaving: upsert.isPending || del.isPending,
  };
}

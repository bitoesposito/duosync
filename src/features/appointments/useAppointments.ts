import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type AppointmentPayload } from "@/lib/api";
import type { DayAppointment } from "@shared";

type Batch = Record<number, DayAppointment[]>;

const keyFor = (date: string) => ["appointments", date] as const;

export function useAppointments(date: string) {
  return useQuery({ queryKey: keyFor(date), queryFn: () => api.listAppointments(date) });
}

export function useUpsertAppointment(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userId: number; appointment: AppointmentPayload }) =>
      api.upsertAppointment(vars.userId, vars.appointment, date),
    onSettled: () => qc.invalidateQueries({ queryKey: keyFor(date) }),
  });
}

export function useDeleteAppointment(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; isRepeating: boolean; templateId?: string }) =>
      api.deleteAppointment(vars.templateId ?? vars.id, vars.isRepeating),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: keyFor(date) });
      const previous = qc.getQueryData<Batch>(keyFor(date));
      if (previous) {
        const next: Batch = {};
        for (const [uid, list] of Object.entries(previous)) {
          next[Number(uid)] = list.filter((a) => a.id !== vars.id);
        }
        qc.setQueryData(keyFor(date), next);
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(keyFor(date), ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keyFor(date) }),
  });
}

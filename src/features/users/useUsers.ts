import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUiStore } from "@/store/ui";

/** Users list + active-user selection (React Query + the UI store). */
export function useUsers() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: api.listUsers,
  });
  const activeUserId = useUiStore((s) => s.activeUserId);
  const selectUser = useUiStore((s) => s.setActiveUserId);
  const activeUser = users.find((u) => u.id === activeUserId);
  return { users, activeUser, selectUser, isLoading };
}

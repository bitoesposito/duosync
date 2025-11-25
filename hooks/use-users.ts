import { useUsersContext } from "@/features/users";

/**
 * Public hook to read the active user and the configured directory.
 */
export function useUsers() {
  return useUsersContext();
}



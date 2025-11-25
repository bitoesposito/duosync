import { getUserDirectory } from "@/lib/config/users";
import { UserProfile } from "@/types";

/**
 * Returns the user list defined in the project-level config file.
 */
export function listUsers(): UserProfile[] {
  return getUserDirectory();
}

/**
 * Finds a user by id or returns undefined when not configured.
 */
export function findUserById(id: number | undefined): UserProfile | undefined {
  if (typeof id === "undefined") return undefined;
  return listUsers().find((user) => user.id === id);
}
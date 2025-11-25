import { UserProfile } from "@/types";

/**
 * Static directory of the users that can be swapped from the header.
 * Extending the available profiles is as easy as editing this array.
 */
export const USER_DIRECTORY: UserProfile[] = [
  { id: 1, name: "Vito Esposito" },
  { id: 2, name: "Vladlen Oleksuk" }
];

/**
 * Returns the list of available users so UI layers keep the config read-only.
 */
export function getUserDirectory(): UserProfile[] {
  return USER_DIRECTORY;
}



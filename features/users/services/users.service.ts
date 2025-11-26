import { UserProfile } from "@/types";

/**
 * Users service - handles all user-related operations.
 * Includes both client-side API calls and utility functions.
 */

// ============================================================================
// CLIENT-SIDE API - HTTP calls from browser
// ============================================================================

/**
 * Fetches all available users from the server via API.
 * Used by the users context to load users on mount.
 * @returns Promise resolving to an array of user profiles
 * @throws Error if the request fails
 */
export async function fetchUsers(): Promise<UserProfile[]> {
  const response = await fetch("/api/users", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load users");
  }

  const data = (await response.json()) as { users: UserProfile[] };
  return data.users || [];
}

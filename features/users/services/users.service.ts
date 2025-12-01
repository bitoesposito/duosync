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

/**
 * Creates a new user in the database via API.
 * @param name - The name of the user to create
 * @returns Promise resolving to the created user profile
 * @throws Error if the request fails
 */
export async function createUser(name: string): Promise<UserProfile> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string; code?: string };
    const errorMessage = new Error(error.error || "Failed to create user");
    // Preserve error code for frontend handling
    if (error.code) {
      (errorMessage as any).code = error.code;
    }
    throw errorMessage;
  }

  const data = (await response.json()) as { user: UserProfile };
  return data.user;
}

/**
 * Updates an existing user in the database via API.
 * @param id - The ID of the user to update
 * @param name - The new name for the user
 * @returns Promise resolving to the updated user profile
 * @throws Error if the request fails
 */
export async function updateUser(id: number, name: string): Promise<UserProfile> {
  const response = await fetch("/api/users", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, name }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error || "Failed to update user");
  }

  const data = (await response.json()) as { user: UserProfile };
  return data.user;
}

/**
 * Deletes a user from the database via API.
 * @param id - The ID of the user to delete
 * @returns Promise resolving when the deletion is complete
 * @throws Error if the request fails
 */
export async function deleteUser(id: number): Promise<void> {
  const response = await fetch("/api/users", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error || "Failed to delete user");
  }
}

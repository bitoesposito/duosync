"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { UserProfile, UsersContextValue } from "@/types";
import { fetchUsers, createUser, updateUser, deleteUser } from "./services/users.service";

const ACTIVE_USER_STORAGE_KEY = "duosync.activeUserId";

export const UsersContext = createContext<UsersContextValue | undefined>(undefined);

/**
 * Parses a stored user ID from localStorage.
 * Returns undefined if the value is invalid or missing.
 */
const parseStoredUserId = (rawId: string | null): number | undefined => {
  if (!rawId) return undefined;
  const parsed = Number(rawId);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Provider component that manages users state and active user selection.
 * Fetches users from the API and persists the active user selection in localStorage.
 * Automatically selects the first user if none is selected.
 */
export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeUserId, setActiveUserId] = useState<number | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return parseStoredUserId(window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY));
  });

  // Load users from database on mount
  useEffect(() => {
    async function loadUsers() {
      try {
        setIsLoading(true);
        const usersData = await fetchUsers();
        setUsers(usersData);

        // Always select the first user if we have users and no valid active user is set
        // Use functional update to avoid dependency on activeUserId
        setActiveUserId((currentId) => {
          // If we have users, ensure one is always selected
          if (usersData.length > 0) {
            // If no current user or current user doesn't exist in the list, select the first one
            if (!currentId || !usersData.some((u) => u.id === currentId)) {
              return usersData[0].id;
            }
            // Keep current user if it's still valid
            return currentId;
          }
          // No users available, clear selection
          return undefined;
        });
      } catch (error) {
        console.error("Error loading users:", error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Persist active user selection
  useEffect(() => {
    if (!activeUserId || typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, String(activeUserId));
  }, [activeUserId]);

  // Ensure a user is always selected when users list changes
  // This handles cases like returning from admin panel after creating a user
  useEffect(() => {
    if (isLoading || users.length === 0) return;

    // If we have users but no valid active user, select the first one
    const hasValidActiveUser = activeUserId && users.some((u) => u.id === activeUserId);
    if (!hasValidActiveUser) {
      setActiveUserId(users[0].id);
    }
  }, [users, activeUserId, isLoading]);

  const selectUser = useCallback(
    (userId: number) => {
      const userExists = users.some((u) => u.id === userId);
      if (!userExists) return;
      setActiveUserId(userId);
    },
    [users]
  );

  /**
   * Reloads users from the API.
   * Used after create, update, or delete operations.
   * Ensures that if users are available, one is always selected.
   */
  const refreshUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const usersData = await fetchUsers();
      setUsers(usersData);

      // Always ensure a user is selected if users are available
      setActiveUserId((currentId) => {
        if (usersData.length > 0) {
          // If no current user or current user doesn't exist, select the first one
          if (!currentId || !usersData.some((u) => u.id === currentId)) {
            return usersData[0].id;
          }
          // Keep current user if it's still valid
          return currentId;
        }
        // No users available, clear selection
        return undefined;
      });
    } catch (error) {
      console.error("Error refreshing users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Creates a new user and refreshes the users list.
   */
  const handleCreateUser = useCallback(
    async (name: string): Promise<UserProfile> => {
      const newUser = await createUser(name);
      await refreshUsers();
      return newUser;
    },
    [refreshUsers]
  );

  /**
   * Updates an existing user and refreshes the users list.
   */
  const handleUpdateUser = useCallback(
    async (id: number, name: string): Promise<UserProfile> => {
      const updatedUser = await updateUser(id, name);
      await refreshUsers();
      return updatedUser;
    },
    [refreshUsers]
  );

  /**
   * Deletes a user and refreshes the users list.
   * If the deleted user was active, selects the first available user.
   */
  const handleDeleteUser = useCallback(
    async (id: number): Promise<void> => {
      await deleteUser(id);
      await refreshUsers();
    },
    [refreshUsers]
  );

  const activeUser = useMemo(
    () => users.find((u) => u.id === activeUserId),
    [activeUserId, users]
  );

  const value = useMemo<UsersContextValue>(
    () => ({
      users,
      activeUser,
      selectUser,
      createUser: handleCreateUser,
      updateUser: handleUpdateUser,
      deleteUser: handleDeleteUser,
      refreshUsers,
      isLoading,
    }),
    [users, activeUser, selectUser, handleCreateUser, handleUpdateUser, handleDeleteUser, refreshUsers, isLoading]
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

/**
 * Hook to access the users context.
 * Exported as useUsers from the feature's public API.
 */
export function useUsersContext() {
  const ctx = useContext(UsersContext);
  if (!ctx) {
    throw new Error("useUsersContext must be used within <UsersProvider>");
  }
  return ctx;
}
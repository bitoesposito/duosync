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
import { UserProfile } from "@/types";

const ACTIVE_USER_STORAGE_KEY = "duosync.activeUserId";

export type UsersContextValue = {
  users: UserProfile[];
  activeUser?: UserProfile;
  selectUser: (userId: number) => void;
  isLoading: boolean;
};

const UsersContext = createContext<UsersContextValue | undefined>(undefined);

/**
 * Provides the list of users from the database and the currently selected one.
 * The selection is persisted in localStorage.
 */
const parseStoredUserId = (rawId: string | null): number | undefined => {
  if (!rawId) return undefined;
  const parsed = Number(rawId);
  return Number.isFinite(parsed) ? parsed : undefined;
};

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
        const response = await fetch("/api/users");
        if (!response.ok) {
          console.error("Failed to load users");
          return;
        }
        const data = await response.json();
        setUsers(data.users || []);

        // If no active user is set and we have users, select the first one
        if (!activeUserId && data.users?.length > 0) {
          const firstUserId = data.users[0].id;
          setActiveUserId(firstUserId);
        }
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, []);

  // Persist active user selection
  useEffect(() => {
    if (!activeUserId || typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, String(activeUserId));
  }, [activeUserId]);

  const selectUser = useCallback(
    (userId: number) => {
      const userExists = users.some((u) => u.id === userId);
      if (!userExists) return;
      setActiveUserId(userId);
    },
    [users]
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
      isLoading,
    }),
    [users, activeUser, selectUser, isLoading]
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsersContext() {
  const ctx = useContext(UsersContext);
  if (!ctx) {
    throw new Error("useUsers deve essere usato all'interno di <UsersProvider>");
  }
  return ctx;
}
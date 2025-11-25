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
import { findUserById, listUsers } from "./services/users.service";

const ACTIVE_USER_STORAGE_KEY = "duosync.activeUserId";

export type UsersContextValue = {
  users: UserProfile[];
  activeUser?: UserProfile;
  selectUser: (userId: number) => void;
};

const UsersContext = createContext<UsersContextValue | undefined>(undefined);

/**
 * Provides the list of configured users and the currently selected one.
 * The selection is persisted in localStorage to emulate a lightweight DB.
 */
const parseStoredUserId = (rawId: string | null): number | undefined => {
  if (!rawId) return undefined;
  const parsed = Number(rawId);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function UsersProvider({ children }: { children: ReactNode }) {
  const users = useMemo(() => listUsers(), []);
  const [activeUserId, setActiveUserId] = useState<number | undefined>(() => {
    if (typeof window === "undefined") return users[0]?.id;
    const storedId = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    const parsed = parseStoredUserId(storedId);
    return findUserById(parsed)?.id ?? users[0]?.id;
  });

  useEffect(() => {
    if (!activeUserId || typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, String(activeUserId));
  }, [activeUserId]);

  const selectUser = useCallback(
    (userId: number) => {
      if (!findUserById(userId)) return;
      setActiveUserId(userId);
    },
    [setActiveUserId]
  );

  const activeUser = useMemo(
    () => findUserById(activeUserId) ?? users[0],
    [activeUserId, users]
  );

  const value = useMemo<UsersContextValue>(
    () => ({
      users,
      activeUser,
      selectUser,
    }),
    [users, activeUser, selectUser]
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



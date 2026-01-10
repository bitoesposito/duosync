"use client";

import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser, clearUser } from "@/store/slices/authSlice";
import { useEffect } from "react";

/**
 * Custom hook to manage authentication state
 * Syncs NextAuth session with Redux store
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  // Sync NextAuth session with Redux
  useEffect(() => {
    if (status === "loading") {
      return; // Still loading, don't update
    }

    if (session?.user) {
      dispatch(
        setUser({
          id: session.user.id || "",
          email: session.user.email || null,
          name: session.user.name || null,
        })
      );
    } else {
      dispatch(clearUser());
    }
  }, [session, status, dispatch]);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: status === "loading",
    session,
  };
}



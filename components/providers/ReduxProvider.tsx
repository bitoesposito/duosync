"use client";

import { Provider } from "react-redux";
import { useRef } from "react";
import { makeStore, AppStore } from "@/store";

/**
 * Redux Provider component for Next.js App Router
 * Creates a new store instance for each request to avoid sharing state between users
 */
export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | undefined>(undefined);
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}


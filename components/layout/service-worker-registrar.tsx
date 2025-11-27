"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/notifications/notifications.service";

/**
 * Client component that registers the service worker on mount.
 * This must be a client component because service worker registration requires browser APIs.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Register service worker
    registerServiceWorker().catch((error) => {
      console.error("Failed to register service worker:", error);
    });
  }, []);

  return null;
}


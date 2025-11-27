"use client";

import { useEffect, useState, useCallback } from "react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
  sendNotification,
} from "@/lib/notifications/notifications.service";

/**
 * Hook for managing push notifications and service worker.
 * Provides functions to request permissions, register service worker, and send notifications.
 */
export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Check support and current permission on mount
  useEffect(() => {
    const supported = isNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      const currentPermission = getNotificationPermission();
      setPermission(currentPermission);
    }
  }, []);

  // Register service worker on mount
  useEffect(() => {
    if (!isSupported) {
      return;
    }

    let cancelled = false;

    registerServiceWorker()
      .then((reg) => {
        if (!cancelled && reg) {
          setRegistration(reg);
          setIsReady(true);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to register service worker:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isSupported]);

  /**
   * Requests notification permission from the user.
   */
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      return false;
    }

    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    return newPermission === "granted";
  }, [isSupported]);

  /**
   * Subscribes to push notifications.
   */
  const subscribe = useCallback(async () => {
    if (!registration || permission !== "granted") {
      return false;
    }

    const subscription = await subscribeToPush(registration);
    return subscription !== null;
  }, [registration, permission]);

  /**
   * Sends a notification.
   */
  const notify = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") {
        return false;
      }

      await sendNotification(title, options);
      return true;
    },
    [isSupported, permission]
  );

  return {
    isSupported,
    permission,
    isReady,
    requestPermission,
    subscribe,
    notify,
  };
}


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
import { useUsers } from "@/features/users";

/**
 * Hook for managing push notifications and service worker.
 * Provides functions to request permissions, register service worker, and send notifications.
 * Automatically registers push subscriptions on the server when permission is granted.
 */
export function useNotifications() {
  const { activeUser } = useUsers();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  // Check support and current permission on mount
  useEffect(() => {
    const supported = isNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      const currentPermission = getNotificationPermission();
      setPermission(currentPermission);
    }
  }, []);

  // Fetch VAPID public key from server
  useEffect(() => {
    if (!isSupported) {
      return;
    }

    let cancelled = false;

    fetch("/api/notifications/vapid-public-key")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.publicKey) {
          setVapidPublicKey(data.publicKey);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to fetch VAPID public key:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isSupported]);

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

  // Register push subscription on server when permission is granted and user is available
  useEffect(() => {
    if (!isReady || !registration || permission !== "granted" || !vapidPublicKey || !activeUser?.id) {
      return;
    }

    let cancelled = false;

    async function registerSubscription() {
      try {
        // Subscribe to push notifications with VAPID key
        const subscription = await subscribeToPush(registration, vapidPublicKey);
        
        if (!subscription || cancelled) {
          return;
        }

        // Send subscription to server
        const response = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: activeUser.id,
            subscription: {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
                auth: arrayBufferToBase64(subscription.getKey("auth")!),
              },
            },
          }),
        });

        if (!response.ok && !cancelled) {
          console.error("Failed to register push subscription on server");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error registering push subscription:", error);
        }
      }
    }

    registerSubscription();

    return () => {
      cancelled = true;
    };
  }, [isReady, registration, permission, vapidPublicKey, activeUser?.id]);

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

/**
 * Converts an ArrayBuffer to a base64 URL-safe string.
 * Used for encoding push subscription keys.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}


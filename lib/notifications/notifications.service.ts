/**
 * Service for managing push notifications and service worker registration.
 * Handles permission requests, subscription management, and notification sending.
 */

/**
 * Checks if the browser supports service workers and notifications.
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return (
    'serviceWorker' in navigator &&
    'Notification' in window &&
    'PushManager' in window
  );
}

/**
 * Gets the current notification permission status.
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Requests notification permission from the user.
 * @returns Promise that resolves to the permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Registers the service worker for push notifications.
 * @returns Promise that resolves to the service worker registration
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Gets the push subscription for the current service worker.
 * @param registration - The service worker registration
 * @returns Promise that resolves to the push subscription or null
 */
export async function getPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
}

/**
 * Subscribes to push notifications.
 * @param registration - The service worker registration
 * @param publicKey - The VAPID public key (optional, for production)
 * @returns Promise that resolves to the push subscription or null
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  publicKey?: string
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      return subscription;
    }

    // For now, we'll use a simple subscription without VAPID keys
    // In production, you would need to generate VAPID keys and pass the public key here
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey
        ? (urlBase64ToUint8Array(publicKey) as BufferSource)
        : undefined,
    });

    return newSubscription;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return null;
  }
}

/**
 * Sends a notification through the service worker.
 * @param title - The notification title
 * @param options - Notification options (body, icon, etc.)
 */
export async function sendNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options,
  });
}

/**
 * Converts a base64 URL-safe string to a Uint8Array.
 * Used for VAPID public key conversion.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


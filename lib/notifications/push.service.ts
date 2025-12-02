/**
 * Service for managing push notifications server-side.
 * Handles VAPID key management and sending push notifications to subscribed users.
 */

import webpush from "web-push";
import { db, schema } from "@/lib/db";
import { eq, ne } from "drizzle-orm";

/**
 * VAPID keys configuration.
 * In production, these should be stored as environment variables.
 * For development, we generate them if not present.
 */
let vapidKeys: { publicKey: string; privateKey: string } | null = null;

/**
 * Initializes VAPID keys from environment variables or generates new ones.
 * Must be called before using push notification functions.
 */
export function initializeVapidKeys(): void {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (publicKey && privateKey) {
    vapidKeys = { publicKey, privateKey };
  } else {
    // Generate new keys for development (not recommended for production)
    console.warn(
      "VAPID keys not found in environment variables. Generating new keys for development."
    );
    const generated = webpush.generateVAPIDKeys();
    vapidKeys = {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey,
    };
    console.log("Generated VAPID keys (save these to .env):");
    console.log(`VAPID_PUBLIC_KEY=${generated.publicKey}`);
    console.log(`VAPID_PRIVATE_KEY=${generated.privateKey}`);
  }

  // Set VAPID details for web-push
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@duosync.local",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

/**
 * Gets the VAPID public key for client-side subscription.
 * @returns The VAPID public key
 */
export function getVapidPublicKey(): string {
  if (!vapidKeys) {
    initializeVapidKeys();
  }
  return vapidKeys!.publicKey;
}

/**
 * Sends a push notification to a specific subscription.
 * @param subscription - The push subscription object
 * @param payload - The notification payload (title, body, etc.)
 */
export async function sendPushNotification(
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  payload: {
    title: string;
    body?: string;
    tag?: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  if (!vapidKeys) {
    initializeVapidKeys();
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body || "",
        tag: payload.tag || "default",
        data: payload.data || {},
      })
    );
  } catch (error) {
    // If subscription is invalid (expired, revoked, etc.), we should remove it from DB
    if (error && typeof error === "object" && "statusCode" in error) {
      const statusCode = error.statusCode as number;
      if (statusCode === 410 || statusCode === 404) {
        // Subscription expired or not found - remove from database
        await db
          .delete(schema.pushSubscriptions)
          .where(eq(schema.pushSubscriptions.endpoint, subscription.endpoint));
        throw new Error("Subscription expired or invalid");
      }
    }
    throw error;
  }
}

/**
 * Sends push notifications to all users except the sender.
 * @param senderUserId - The ID of the user who triggered the notification
 * @param payload - The notification payload
 */
export async function sendPushToOtherUsers(
  senderUserId: number,
  payload: {
    title: string;
    body?: string;
    tag?: string;
    data?: Record<string, unknown>;
  }
): Promise<{ sent: number; failed: number }> {
  try {
    // Get all push subscriptions for users OTHER than the sender
    const otherSubscriptions = await db
      .select()
      .from(schema.pushSubscriptions)
      .where(ne(schema.pushSubscriptions.userId, senderUserId));

    let sent = 0;
    let failed = 0;

    // Send notification to each subscription
    for (const sub of otherSubscriptions) {
      try {
        await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        sent++;
      } catch (error) {
        console.error(`Failed to send push notification to ${sub.endpoint}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  } catch (error) {
    console.error("Error sending push notifications:", error);
    throw error;
  }
}


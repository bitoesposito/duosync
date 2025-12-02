import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

type SubscribePayload = {
  userId?: number;
  subscription?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
};

/**
 * POST /api/notifications/subscribe
 * Registers a push notification subscription for a user.
 * If a subscription with the same endpoint exists, it updates it.
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SubscribePayload;

    if (
      !Number.isFinite(payload.userId) ||
      !payload.subscription ||
      !payload.subscription.endpoint ||
      !payload.subscription.keys?.p256dh ||
      !payload.subscription.keys?.auth
    ) {
      return NextResponse.json(
        { error: "Dati di sottoscrizione non validi" },
        { status: 400 }
      );
    }

    const userId = payload.userId!;
    const { endpoint, keys } = payload.subscription;

    // Check if subscription already exists for this endpoint
    const existing = await db
      .select()
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.endpoint, endpoint))
      .limit(1);

    if (existing.length > 0) {
      // Update existing subscription (user might have switched accounts)
      await db
        .update(schema.pushSubscriptions)
        .set({
          userId,
          p256dh: keys.p256dh,
          auth: keys.auth,
          updatedAt: new Date(),
        })
        .where(eq(schema.pushSubscriptions.endpoint, endpoint));
    } else {
      // Create new subscription
      await db.insert(schema.pushSubscriptions).values({
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return NextResponse.json(
      { error: "Errore nella registrazione delle notifiche" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/subscribe
 * Unsubscribes a user from push notifications by removing their subscription.
 */
export async function DELETE(request: Request) {
  try {
    const payload = (await request.json()) as { endpoint?: string };

    if (!payload.endpoint) {
      return NextResponse.json(
        { error: "Endpoint obbligatorio" },
        { status: 400 }
      );
    }

    await db
      .delete(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.endpoint, payload.endpoint));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return NextResponse.json(
      { error: "Errore nella rimozione della sottoscrizione" },
      { status: 500 }
    );
  }
}



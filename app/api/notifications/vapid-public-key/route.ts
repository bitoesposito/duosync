import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/notifications/push.service";

/**
 * GET /api/notifications/vapid-public-key
 * Returns the VAPID public key for client-side push subscription.
 */
export async function GET() {
  try {
    const publicKey = getVapidPublicKey();
    return NextResponse.json({ publicKey });
  } catch (error) {
    console.error("Error getting VAPID public key:", error);
    return NextResponse.json(
      { error: "Errore nel recupero della chiave pubblica" },
      { status: 500 }
    );
  }
}


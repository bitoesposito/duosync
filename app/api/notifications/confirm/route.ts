import { NextResponse } from "next/server";
import { sendPushToOtherUsers } from "@/lib/notifications/push.service";

type ConfirmPayload = {
  userId?: number;
};

/**
 * POST /api/notifications/confirm
 * Sends push notifications to all other users when a user confirms their appointments.
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ConfirmPayload;

    if (!Number.isFinite(payload.userId)) {
      return NextResponse.json(
        { error: "ID utente obbligatorio" },
        { status: 400 }
      );
    }

    const userId = payload.userId!;

    // Send push notifications to all other users
    // Note: Translations are handled client-side, so we use Italian as default
    // In a production app, you might want to store user preferences for language
    const result = await sendPushToOtherUsers(userId, {
      title: "Nuova conferma impegni",
      body: "Un utente ha confermato i propri impegni. Compila i tuoi impegni per verificare le disponibilità condivise.",
      tag: "appointment-confirmation",
      data: {
        type: "appointment-confirmation",
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error("Error sending confirmation notifications:", error);
    return NextResponse.json(
      { error: "Errore nell'invio delle notifiche" },
      { status: 500 }
    );
  }
}


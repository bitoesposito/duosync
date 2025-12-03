import { NextResponse } from "next/server";
import { sendPushToAllUsers } from "@/lib/notifications/push.service";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

type ConfirmPayload = {
  userId?: number;
};

/**
 * POST /api/notifications/confirm
 * Sends push notifications to all users with notifications enabled when a user confirms their appointments.
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

    // Get user name from database
    const userResult = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    const userName = userResult[0]?.name || "Un utente";

    // Send push notifications to all users with notifications enabled
    // Note: Translations are handled client-side, so we use Italian as default
    // In a production app, you might want to store user preferences for language
    const result = await sendPushToAllUsers({
      title: "Nuova conferma impegni",
      body: `${userName} ha confermato i propri impegni. Compila i tuoi impegni per verificare le disponibilità condivise.`,
      tag: "appointment-confirmation",
      data: {
        type: "appointment-confirmation",
        userId,
        userName,
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


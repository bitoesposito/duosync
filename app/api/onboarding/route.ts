import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { userName, pin } = await request.json();

    if (!userName || !pin || pin.length !== 6) {
      return NextResponse.json(
        { error: "Dati non validi" },
        { status: 400 }
      );
    }

    // 1. Create initial settings with PIN
    await db.insert(schema.appSettings).values({
      id: 1,
      adminPin: pin, // In production, hash this!
      isInitialized: true,
    }).onConflictDoUpdate({
      target: schema.appSettings.id,
      set: {
        adminPin: pin,
        isInitialized: true,
        updatedAt: new Date(),
      }
    });

    // 2. Create first user (Admin)
    await db.insert(schema.users).values({
      name: userName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Errore durante l'inizializzazione" },
      { status: 500 }
    );
  }
}


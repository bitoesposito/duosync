import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { UserProfile } from "@/types";

/**
 * GET /api/users
 * Returns the list of all users from the database.
 */
export async function GET() {
  try {
    const result = await db.select().from(schema.users);
    const users: UserProfile[] = result.map((user) => ({
      id: user.id,
      name: user.name,
    }));
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento degli utenti" },
      { status: 500 }
    );
  }
}


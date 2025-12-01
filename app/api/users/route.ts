import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { UserProfile } from "@/types";
import { eq, count } from "drizzle-orm";
import { MAX_USERS } from "@/lib/config/users";

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

type CreateUserPayload = {
  name?: string;
};

/**
 * POST /api/users
 * Creates a new user in the database.
 * Validates that the maximum number of users (MAX_USERS) is not exceeded.
 */
export async function POST(request: Request) {
  const payload = (await request.json()) as CreateUserPayload;
  if (!payload.name || typeof payload.name !== "string" || payload.name.trim().length === 0) {
    return NextResponse.json(
      { error: "Il nome è obbligatorio" },
      { status: 400 }
    );
  }

  try {
    // Check current user count before creating new user
    const userCountResult = await db
      .select({ count: count() })
      .from(schema.users);
    
    const currentUserCount = userCountResult[0]?.count ?? 0;
    
    if (currentUserCount >= MAX_USERS) {
      return NextResponse.json(
        { 
          error: `Limite massimo di ${MAX_USERS} utenti raggiunto. Elimina un utente esistente per crearne uno nuovo.`,
          code: "MAX_USERS_EXCEEDED"
        },
        { status: 403 }
      );
    }

    const result = await db
      .insert(schema.users)
      .values({ name: payload.name.trim() })
      .returning();
    
    const user: UserProfile = {
      id: result[0].id,
      name: result[0].name,
    };
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return NextResponse.json(
      { error: "Errore nella creazione dell'utente" },
      { status: 500 }
    );
  }
}

type UpdateUserPayload = {
  id?: number;
  name?: string;
};

/**
 * PUT /api/users
 * Updates an existing user in the database.
 */
export async function PUT(request: Request) {
  const payload = (await request.json()) as UpdateUserPayload;
  if (
    !Number.isFinite(payload.id) ||
    !payload.name ||
    typeof payload.name !== "string" ||
    payload.name.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "ID e nome sono obbligatori" },
      { status: 400 }
    );
  }

  try {
    const result = await db
      .update(schema.users)
      .set({ name: payload.name.trim(), updatedAt: new Date() })
      .where(eq(schema.users.id, payload.id!))
      .returning();
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 }
      );
    }
    
    const user: UserProfile = {
      id: result[0].id,
      name: result[0].name,
    };
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in PUT /api/users:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento dell'utente" },
      { status: 500 }
    );
  }
}

type DeleteUserPayload = {
  id?: number;
};

/**
 * DELETE /api/users
 * Deletes a user from the database.
 */
export async function DELETE(request: Request) {
  const payload = (await request.json()) as DeleteUserPayload;
  if (!Number.isFinite(payload.id)) {
    return NextResponse.json(
      { error: "ID utente obbligatorio" },
      { status: 400 }
    );
  }

  try {
    const result = await db
      .delete(schema.users)
      .where(eq(schema.users.id, payload.id!))
      .returning();
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in DELETE /api/users:", error);
    return NextResponse.json(
      { error: "Errore nell'eliminazione dell'utente" },
      { status: 500 }
    );
  }
}


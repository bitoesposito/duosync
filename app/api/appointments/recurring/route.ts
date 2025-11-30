import { NextRequest, NextResponse } from "next/server";
import { getAllRecurringTemplatesFromDb } from "@/features/appointments/services/appointments.db.service";

const invalidUserResponse = () =>
  NextResponse.json(
    { error: "userId numerico obbligatorio" },
    { status: 400 }
  );

/**
 * GET /api/appointments/recurring?userId=1
 * Returns all recurring appointment templates for a specific user (not filtered by date).
 * Used to show recurring appointments in the list even when they're not active today.
 */
export async function GET(request: NextRequest) {
  const userIdParam = request.nextUrl.searchParams.get("userId");
  const userId = userIdParam ? Number(userIdParam) : undefined;
  
  if (!Number.isFinite(userId)) {
    return invalidUserResponse();
  }

  try {
    const recurringTemplates = await getAllRecurringTemplatesFromDb(userId!);
    return NextResponse.json({ recurringTemplates });
  } catch (error) {
    console.error("Error in GET /api/appointments/recurring:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento degli impegni ricorrenti" },
      { status: 500 }
    );
  }
}


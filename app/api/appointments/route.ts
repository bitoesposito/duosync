import { NextRequest, NextResponse } from "next/server";
import { listAppointmentsFromDb } from "@/features/appointments/services/appointments-db.service";

const invalidUserResponse = () =>
  NextResponse.json(
    { error: "userId numerico obbligatorio" },
    { status: 400 }
  );

/**
 * GET /api/appointments?userId=1&date=2025-11-25 (optional)
 * Returns appointments for a specific user and date (defaults to today).
 */
export async function GET(request: NextRequest) {
  const userIdParam = request.nextUrl.searchParams.get("userId");
  const dateParam = request.nextUrl.searchParams.get("date");
  const userId = userIdParam ? Number(userIdParam) : undefined;
  
  if (!Number.isFinite(userId)) {
    return invalidUserResponse();
  }

  try {
    const appointments = await listAppointmentsFromDb(userId!, dateParam || undefined);
    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error in GET /api/appointments:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento degli impegni" },
      { status: 500 }
    );
  }
}


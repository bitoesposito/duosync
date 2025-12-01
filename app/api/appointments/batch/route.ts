import { NextRequest, NextResponse } from "next/server";
import { listAppointmentsBatchFromDb } from "@/features/appointments/services/appointments.db.service";

/**
 * GET /api/appointments/batch?userIds=1,2&date=2025-11-25 (optional)
 * Returns appointments for multiple users in parallel.
 * Optimized endpoint that loads appointments for all users in a single request.
 */
export async function GET(request: NextRequest) {
  const userIdsParam = request.nextUrl.searchParams.get("userIds");
  const dateParam = request.nextUrl.searchParams.get("date");

  if (!userIdsParam) {
    return NextResponse.json(
      { error: "userIds parameter is required (comma-separated)" },
      { status: 400 }
    );
  }

  // Parse userIds from comma-separated string
  const userIds = userIdsParam
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isFinite(id) && id > 0);

  if (userIds.length === 0) {
    return NextResponse.json(
      { error: "At least one valid userId is required" },
      { status: 400 }
    );
  }

  try {
    const appointmentsByUser = await listAppointmentsBatchFromDb(
      userIds,
      dateParam || undefined
    );
    return NextResponse.json({ appointmentsByUser });
  } catch (error) {
    console.error("Error in GET /api/appointments/batch:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento degli impegni" },
      { status: 500 }
    );
  }
}
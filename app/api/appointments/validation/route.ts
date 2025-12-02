import { NextRequest, NextResponse } from "next/server";
import { getAllAppointmentsForValidation } from "@/features/appointments/services/appointments.db-validation.service";

const invalidUserResponse = () =>
  NextResponse.json(
    { error: "userId numerico obbligatorio" },
    { status: 400 }
  );

/**
 * GET /api/appointments/validation?userId=1&days=1,2,3
 * Returns all recurring appointments and one-time appointments for validation purposes.
 * Used when creating/editing recurring appointments to check for overlaps.
 */
export async function GET(request: NextRequest) {
  const userIdParam = request.nextUrl.searchParams.get("userId");
  const daysParam = request.nextUrl.searchParams.get("days");
  const userId = userIdParam ? Number(userIdParam) : undefined;
  
  if (!Number.isFinite(userId)) {
    return invalidUserResponse();
  }

  // Parse days parameter (comma-separated list of day IDs: 1,2,3)
  const daysToCheck = daysParam
    ? (daysParam
        .split(",")
        .filter((day) => /^[1-7]$/.test(day.trim())) as Array<"1" | "2" | "3" | "4" | "5" | "6" | "7">)
    : [];

  try {
    const { recurringAppointments, oneTimeAppointments } =
      await getAllAppointmentsForValidation(userId!, daysToCheck);
    
    return NextResponse.json({
      recurringAppointments,
      oneTimeAppointments,
    });
  } catch (error) {
    console.error("Error in GET /api/appointments/validation:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento degli impegni per validazione" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { createAppointmentInDb } from "@/features/appointments/services/appointments-db.service";
import { Appointment } from "@/types";

type AddPayload = {
  userId?: number;
  appointment?: Appointment;
  date?: string; // Optional date, defaults to today
};

/**
 * POST /api/appointments/add
 * Creates a new appointment in the database for a specific user and date.
 */
export async function POST(request: Request) {
  const payload = (await request.json()) as AddPayload;
  if (
    !Number.isFinite(payload.userId) ||
    !payload.appointment ||
    typeof payload.appointment.id !== "string"
  ) {
    return NextResponse.json(
      { error: "Payload non valido" },
      { status: 400 }
    );
  }

  try {
    await createAppointmentInDb(
      payload.userId!,
      payload.appointment,
      payload.date
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in POST /api/appointments/add:", error);
    return NextResponse.json(
      { error: "Errore nel salvataggio dell'impegno" },
      { status: 500 }
    );
  }
}
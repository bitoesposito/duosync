import { NextResponse } from "next/server";
import { updateAppointmentInDb } from "@/features/appointments/services/appointments.db.service";
import { Appointment } from "@/types";

type UpdatePayload = {
  userId?: number;
  appointmentId?: string;
  appointment?: Appointment;
};

/**
 * PUT /api/appointments/update
 * Updates an existing appointment in the database.
 */
export async function PUT(request: Request) {
  const payload = (await request.json()) as UpdatePayload;
  if (
    !Number.isFinite(payload.userId) ||
    !payload.appointmentId ||
    !payload.appointment ||
    typeof payload.appointmentId !== "string"
  ) {
    return NextResponse.json(
      { error: "Payload non valido" },
      { status: 400 }
    );
  }

  try {
    await updateAppointmentInDb(
      payload.userId!,
      payload.appointmentId,
      payload.appointment
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in PUT /api/appointments/update:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento dell'impegno" },
      { status: 500 }
    );
  }
}


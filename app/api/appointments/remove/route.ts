import { NextResponse } from "next/server";
import { deleteAppointmentFromDb } from "@/features/appointments/services/appointments-db.service";

type RemovePayload = {
  userId?: number;
  appointmentId?: string;
};

/**
 * POST /api/appointments/remove
 * Deletes an appointment from the database.
 */
export async function POST(request: Request) {
  const payload = (await request.json()) as RemovePayload;
  if (
    !Number.isFinite(payload.userId) ||
    !payload.appointmentId ||
    typeof payload.appointmentId !== "string"
  ) {
    return NextResponse.json(
      { error: "Payload non valido" },
      { status: 400 }
    );
  }

  try {
    await deleteAppointmentFromDb(payload.userId!, payload.appointmentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in POST /api/appointments/remove:", error);
    return NextResponse.json(
      { error: "Errore nell'eliminazione dell'impegno" },
      { status: 500 }
    );
  }
}
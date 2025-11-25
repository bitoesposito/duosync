import { NextResponse } from "next/server";
import { addDailyAppointment } from "@/lib/storage/daily-appointments.store";
import { Appointment } from "@/types";

type AddPayload = {
  userId?: number;
  appointment?: Appointment;
};

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

  await addDailyAppointment(payload.userId!, payload.appointment);
  return NextResponse.json({ ok: true });
}



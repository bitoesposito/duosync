import { NextResponse } from "next/server";
import { removeDailyAppointment } from "@/lib/storage/daily-appointments.store";

type RemovePayload = {
  userId?: number;
  appointmentId?: string;
};

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

  await removeDailyAppointment(payload.userId!, payload.appointmentId);
  return NextResponse.json({ ok: true });
}



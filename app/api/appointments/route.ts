import { NextRequest, NextResponse } from "next/server";
import { loadDailyAppointments } from "@/lib/storage/daily-appointments.store";

const invalidUserResponse = () =>
  NextResponse.json(
    { error: "userId numerico obbligatorio" },
    { status: 400 }
  );

export async function GET(request: NextRequest) {
  const userIdParam = request.nextUrl.searchParams.get("userId");
  const userId = userIdParam ? Number(userIdParam) : undefined;
  if (!Number.isFinite(userId)) {
    return invalidUserResponse();
  }

  const appointments = await loadDailyAppointments(userId);
  return NextResponse.json({ appointments });
}


import { NextResponse } from "next/server";
import { getAppSettings } from "@/lib/settings";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const settings = await getAppSettings();

    if (!settings || !settings.isInitialized) {
      return NextResponse.json({ error: "App non inizializzata" }, { status: 400 });
    }

    if (pin === settings.adminPin) {
      // Set admin session cookie
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "PIN non valido" }, { status: 401 });
    }
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}


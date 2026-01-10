import { NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * GET /api/auth/magic-link/status
 * 
 * Returns whether magic link authentication is enabled
 */
export async function GET() {
  return NextResponse.json({
    enabled: !!env.EMAIL_SERVER,
  });
}


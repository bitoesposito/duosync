import { NextResponse } from "next/server";
import { createAuthenticationOptions } from "@/lib/auth/passkeys";

/**
 * POST /api/auth/passkey/auth-challenge
 * 
 * Generates WebAuthn challenge for passkey authentication
 * Returns options for navigator.credentials.get()
 * 
 * Note: No email filtering - browser/authenticator will handle credential discovery
 */
export async function POST(request: Request) {
  try {
    // No email filtering - let the browser/authenticator discover all available passkeys
    // This allows users to choose from any passkey they have access to
    const options = await createAuthenticationOptions(undefined);

    const response = NextResponse.json({
      success: true,
      options,
    });

    // Store challenge in httpOnly cookie for verification
    response.cookies.set("webauthn_challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Passkey auth challenge error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred generating authentication challenge",
        },
      },
      { status: 500 }
    );
  }
}

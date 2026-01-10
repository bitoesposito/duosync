import { NextResponse } from "next/server";
import { createRegistrationOptions } from "@/lib/auth/passkeys";
import { z } from "zod";
import { cookies } from "next/headers";

/**
 * Request schema for passkey registration challenge
 */
const challengeSchema = z.object({
  userId: z.number(),
  userName: z.string(),
  userEmail: z.string().email(),
});

/**
 * POST /api/auth/passkey/register-challenge
 * 
 * Generates WebAuthn challenge for passkey registration
 * Returns options for navigator.credentials.create()
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = challengeSchema.parse(body);
    const cookieStore = await cookies();

    const options = await createRegistrationOptions(
      validatedData.userId.toString(),
      validatedData.userName,
      validatedData.userEmail
    );

    // Store challenge in httpOnly cookie for verification
    const response = NextResponse.json({
      success: true,
      options,
    });

    response.cookies.set("webauthn_challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error("Passkey challenge error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred generating passkey challenge",
        },
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passkeys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { cookies } from "next/headers";
import { verifyRegistration } from "@/lib/auth/passkeys";
import { env } from "@/lib/env";
import type { Base64URLString, RegistrationResponseJSON } from "@simplewebauthn/types";

/**
 * Request schema for passkey registration verification
 */
const verifySchema = z.object({
  userId: z.number(),
  credential: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      attestationObject: z.string(),
    }),
    type: z.literal("public-key"),
    clientExtensionResults: z.record(z.string(), z.any()).optional(),
  }),
});

/**
 * POST /api/auth/passkey/register-verify
 * 
 * Verifies passkey registration and saves credential
 * Then automatically logs in the user
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = verifySchema.parse(body);
    const cookieStore = await cookies();

    // Get stored challenge
    const challenge = cookieStore.get("webauthn_challenge")?.value;
    if (!challenge) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CHALLENGE_EXPIRED",
            message: "Challenge expired or invalid",
          },
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, validatedData.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        },
        { status: 404 }
      );
    }

    // Prepare registration response
    // Use rawId as the canonical credential ID (it's what the browser always sends)
    const registrationResponse: RegistrationResponseJSON = {
      id: validatedData.credential.rawId, // Use rawId as id
      rawId: validatedData.credential.rawId,
      response: {
        clientDataJSON: validatedData.credential.response.clientDataJSON,
        attestationObject: validatedData.credential.response.attestationObject,
      },
      type: validatedData.credential.type,
      clientExtensionResults: validatedData.credential.clientExtensionResults || {},
    };

    // Verify WebAuthn attestation
    const verification = await verifyRegistration(
      registrationResponse,
      challenge,
      env.NEXTAUTH_URL,
      env.WEBAUTHN_RP_ID
    );

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VERIFICATION_FAILED",
            message: "Passkey verification failed",
          },
        },
        { status: 400 }
      );
    }

    // Extract credential info from registrationInfo
    const { credential } = verification.registrationInfo;
    // Use the rawId (base64url encoded) as the credential ID
    // This matches what the browser/Bitwarden will send during authentication
    const credentialID = validatedData.credential.rawId as Base64URLString;
    const credentialPublicKey = Buffer.from(credential.publicKey);
    const counter = credential.counter || 0;
    
    console.log("Saving credential ID:", credentialID);

    // Detect device type from credential transports
    // If no transports specified or includes "usb"/"nfc"/"ble", it's cross-platform (Bitwarden, etc.)
    // If only "internal", it's platform (Touch ID, Face ID, Windows Hello)
    const transports = credential.transports || [];
    const hasInternalOnly = transports.length === 1 && transports.includes("internal");
    const deviceType = hasInternalOnly ? "platform" : "cross-platform";

    // Save passkey credential
    await db.insert(passkeys).values({
      userId: validatedData.userId,
      credentialId: credentialID,
      publicKey: credentialPublicKey.toString("base64url"),
      counter: counter,
      deviceType: deviceType,
    });

    // Clear challenge cookie
    const response = NextResponse.json({
      success: true,
      message: "Passkey registered successfully",
      token: user.token, // Return token so client can login
    });

    response.cookies.delete("webauthn_challenge");

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

    // Check for unique constraint violation (credential already exists)
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CREDENTIAL_EXISTS",
            message: "This passkey is already registered",
          },
        },
        { status: 409 }
      );
    }

    console.error("Passkey verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred verifying passkey",
        },
      },
      { status: 500 }
    );
  }
}

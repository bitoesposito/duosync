import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passkeys } from "@/lib/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { cookies } from "next/headers";
import { verifyAuthentication } from "@/lib/auth/passkeys";
import { env } from "@/lib/env";
import type { Base64URLString, AuthenticationResponseJSON } from "@simplewebauthn/types";

/**
 * Request schema for passkey authentication verification
 */
const verifySchema = z.object({
  credential: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      authenticatorData: z.string(),
      signature: z.string(),
      userHandle: z.string().nullable().optional(),
    }),
    type: z.literal("public-key"),
    clientExtensionResults: z.record(z.string(), z.any()).optional(),
  }),
});

/**
 * Normalize credential ID - handle both base64url and raw formats
 */
function normalizeCredentialId(id: string): string {
  // If it's already base64url (contains - or _), return as is
  if (/[-_]/.test(id)) {
    return id;
  }
  // Otherwise, it might be base64, convert to base64url
  return id.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * POST /api/auth/passkey/auth-verify
 * 
 * Verifies passkey authentication and logs in user
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

    // The credential.id from the client might be in different formats
    // Normalize it and try to find matching passkey
    const credentialIdFromClient = validatedData.credential.id;
    const normalizedCredentialId = normalizeCredentialId(credentialIdFromClient);
    
    // Try to find passkey by exact match or normalized match
    // Also try matching with the rawId (base64url encoded)
    const rawIdBase64Url = validatedData.credential.rawId;
    
    let [passkey] = await db
      .select({
        id: passkeys.id,
        userId: passkeys.userId,
        credentialId: passkeys.credentialId,
        publicKey: passkeys.publicKey,
        counter: passkeys.counter,
      })
      .from(passkeys)
      .where(
        or(
          eq(passkeys.credentialId, credentialIdFromClient),
          eq(passkeys.credentialId, normalizedCredentialId),
          eq(passkeys.credentialId, rawIdBase64Url)
        )
      )
      .limit(1);

    if (!passkey) {
      // Get all passkeys for debugging
      const allPasskeys = await db
        .select({
          id: passkeys.id,
          credentialId: passkeys.credentialId,
        })
        .from(passkeys)
        .limit(100);

      console.log("Looking for credential ID (rawId):", credentialIdToSearch);
      console.log("Available credential IDs:", allPasskeys.map(p => p.credentialId));

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIAL",
            message: "Invalid passkey - credential not found",
            debug: {
              searchedId: credentialIdToSearch,
              availableIds: allPasskeys.map(p => p.credentialId),
            },
          },
        },
        { status: 401 }
      );
    }

    // Prepare authentication response
    const authenticationResponse: AuthenticationResponseJSON = {
      id: validatedData.credential.id,
      rawId: validatedData.credential.rawId,
      response: {
        clientDataJSON: validatedData.credential.response.clientDataJSON,
        authenticatorData: validatedData.credential.response.authenticatorData,
        signature: validatedData.credential.response.signature,
        userHandle: validatedData.credential.response.userHandle || null,
      },
      type: validatedData.credential.type,
      clientExtensionResults: validatedData.credential.clientExtensionResults || {},
    };

    // Verify WebAuthn signature
    // Use the credential ID that matches what SimpleWebAuthn expects
    const verification = await verifyAuthentication(
      authenticationResponse,
      challenge,
      env.NEXTAUTH_URL,
      env.WEBAUTHN_RP_ID,
      {
        credentialID: passkey.credentialId as Base64URLString,
        credentialPublicKey: Buffer.from(passkey.publicKey, "base64url"),
        counter: passkey.counter,
      }
    );

    if (!verification.verified) {
      console.error("Passkey verification failed:", {
        credentialId: passkey.credentialId,
        error: verification,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VERIFICATION_FAILED",
            message: "Passkey verification failed",
          },
        },
        { status: 401 }
      );
    }

    // Update passkey counter and last used
    await db
      .update(passkeys)
      .set({
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      })
      .where(eq(passkeys.id, passkey.id));

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, passkey.userId))
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

    // Clear challenge cookie
    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
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

    console.error("Passkey auth verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred verifying authentication",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Passkey Discover Verification API
 * 
 * Verifies authentication with discoverable credentials.
 * Does not require email/userId - credential ID is enough to identify the user.
 * 
 * @route POST /api/auth/passkey/verify-discover
 */

import { NextRequest, NextResponse } from "next/server"
import { verifyAuthenticationResponse } from "@simplewebauthn/server"
import { env } from "@/lib/env"
import {
	findPasskeyCredential,
	updatePasskeyCounter,
} from "@/lib/services/auth.service"

const rpID = new URL(env.NEXTAUTH_URL).hostname
const origin = env.NEXTAUTH_URL

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const challenge = request.cookies.get("passkey_challenge")?.value
		
		if (!challenge) {
			return NextResponse.json(
				{ 
					error: "Authentication session expired. Please try again.",
					code: "MISSING_CHALLENGE"
				},
				{ status: 400 }
			)
		}
		
		// Find credential using rawId from body (already base64url from browser)
		const rawId = body.rawId || body.id
		if (!rawId) {
			return NextResponse.json(
				{ 
					error: "Missing credential ID",
					code: "MISSING_CREDENTIAL_ID"
				},
				{ status: 400 }
			)
		}
		
		// rawId is already base64url from browser
		const credentialId = typeof rawId === "string" ? rawId : Buffer.from(rawId).toString("base64url")
		const credential = await findPasskeyCredential(credentialId)
		
		if (!credential) {
			return NextResponse.json(
				{ 
					error: "Passkey not found. It may have been deleted or belongs to another account.",
					code: "CREDENTIAL_NOT_FOUND"
				},
				{ status: 404 }
			)
		}
		
		// Verify authentication response
		// credential.id must be a Base64URLString (string), not a Buffer
		const verification = await verifyAuthenticationResponse({
			response: body,
			expectedChallenge: challenge,
			expectedOrigin: origin,
			expectedRPID: rpID,
			credential: {
				id: credential.credentialId, // Already base64url string
				publicKey: Buffer.from(credential.publicKey, "base64url"),
				counter: credential.counter,
			},
			requireUserVerification: false,
		})
		
		if (!verification.verified) {
			return NextResponse.json(
				{ 
					error: "Passkey verification failed. Please try again.",
					code: "VERIFICATION_FAILED"
				},
				{ status: 400 }
			)
		}
		
		// Update counter to prevent replay attacks
		await updatePasskeyCounter(
			credentialId,
			verification.authenticationInfo.newCounter
		)
		
		// Get user associated with credential
		const user = credential.user
		if (!user) {
			return NextResponse.json(
				{ 
					error: "User account not found",
					code: "USER_NOT_FOUND"
				},
				{ status: 404 }
			)
		}
		
		// Create session (store token in cookie)
		const response = NextResponse.json({
			success: true,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
			},
		})
		
		// Clear temporary cookies
		response.cookies.delete("passkey_challenge")
		
		// Store authentication token in cookie
		response.cookies.set("auth_token", user.token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30, // 30 days
		})
		
		return response
	} catch (error) {
		console.error("Passkey discover verification error:", error)
		
		// Provide more specific error messages
		if (error instanceof Error) {
			if (error.message.includes("challenge")) {
				return NextResponse.json(
					{ 
						error: "Authentication session expired. Please try again.",
						code: "CHALLENGE_EXPIRED"
					},
					{ status: 400 }
				)
			}
			if (error.message.includes("signature")) {
				return NextResponse.json(
					{ 
						error: "Invalid passkey signature. Please try again.",
						code: "INVALID_SIGNATURE"
					},
					{ status: 400 }
				)
			}
		}
		
		return NextResponse.json(
			{ 
				error: "Failed to verify authentication",
				code: "VERIFICATION_ERROR"
			},
			{ status: 500 }
		)
	}
}

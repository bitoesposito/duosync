/**
 * Passkey Registration Verification API
 * 
 * Verifies WebAuthn registration response and stores the passkey credential.
 * Handles both new user creation and adding passkeys to existing accounts.
 * 
 * @route POST /api/auth/passkey/verify-registration
 */

import { NextRequest, NextResponse } from "next/server"
import { verifyRegistrationResponse } from "@simplewebauthn/server"
import { env } from "@/lib/env"
import {
	createUser,
	storePasskeyCredential,
	findUserByToken,
} from "@/lib/services/auth.service"
import type { 
	AuthenticatorTransportFuture,
	CredentialDeviceType,
} from "@simplewebauthn/server"

const rpID = new URL(env.NEXTAUTH_URL).hostname
const origin = env.NEXTAUTH_URL

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const challenge = request.cookies.get("passkey_challenge")?.value
		const userDataStr = request.cookies.get("passkey_user_data")?.value
		
		if (!challenge || !userDataStr) {
			return NextResponse.json(
				{ 
					error: "Registration session expired. Please start over.",
					code: "MISSING_SESSION_DATA"
				},
				{ status: 400 }
			)
		}
		
		let userData
		try {
			userData = JSON.parse(userDataStr)
		} catch {
			return NextResponse.json(
				{ 
					error: "Invalid session data. Please start over.",
					code: "INVALID_SESSION_DATA"
				},
				{ status: 400 }
			)
		}
		
		// Verify WebAuthn registration response
		const verification = await verifyRegistrationResponse({
			response: body,
			expectedChallenge: challenge,
			expectedOrigin: origin,
			expectedRPID: rpID,
			requireUserVerification: false,
		})
		
		if (!verification.verified || !verification.registrationInfo) {
			console.error("Verification failed:", { 
				verified: verification.verified, 
				hasInfo: !!verification.registrationInfo 
			})
			return NextResponse.json(
				{ 
					error: "Passkey verification failed. Please try again.",
					code: "VERIFICATION_FAILED"
				},
				{ status: 400 }
			)
		}
		
		const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo
		
		// credential.id is already a base64url string from SimpleWebAuthn
		if (!credential || !credential.id) {
			console.error("Missing credential in registrationInfo:", {
				keys: Object.keys(verification.registrationInfo),
				hasCredential: !!credential,
			})
			return NextResponse.json(
				{ 
					error: "Invalid passkey data received. Please try again.",
					code: "MISSING_CREDENTIAL"
				},
				{ status: 400 }
			)
		}
		
		// Extract credential data
		const credentialIdBase64 = credential.id // Already base64url
		const credentialPublicKey = credential.publicKey
		const counter = credential.counter || 0
		const transports = credential.transports || body.response?.transports
		
		// Determine if adding passkey to existing account or creating new user
		const existingUserId = request.cookies.get("passkey_user_id")?.value
		const authToken = request.cookies.get("auth_token")?.value
		let user
		let token
		
		if (existingUserId && authToken) {
			// Authenticated user: add passkey to existing account
			const existingUser = await findUserByToken(authToken)
			if (!existingUser) {
				console.error("User not found for token:", { hasToken: !!authToken })
				return NextResponse.json(
					{ 
						error: "Authentication session expired. Please sign in again.",
						code: "SESSION_EXPIRED"
					},
					{ status: 401 }
				)
			}
			if (existingUser.id !== parseInt(existingUserId)) {
				console.error("User ID mismatch:", { 
					expected: existingUserId, 
					actual: existingUser.id,
					hasToken: !!authToken 
				})
				return NextResponse.json(
					{ 
						error: "Invalid user session",
						code: "INVALID_SESSION"
					},
					{ status: 400 }
				)
			}
			user = existingUser
			token = authToken
		} else {
			// New registration: create new user
			try {
				const result = await createUser(userData.name, userData.email)
				user = result.user
				token = result.token
			} catch (err) {
				console.error("User creation error:", err)
				return NextResponse.json(
					{ 
						error: "Failed to create account. Please try again.",
						code: "USER_CREATION_FAILED"
					},
					{ status: 500 }
				)
			}
		}
		
		// Store passkey credential in database
		try {
			await storePasskeyCredential(
				user.id,
				credentialIdBase64,
				Buffer.from(credentialPublicKey).toString("base64url"),
				counter,
				credentialDeviceType as CredentialDeviceType,
				transports as AuthenticatorTransportFuture[],
				userData.name
			)
		} catch (err) {
			console.error("Passkey storage error:", err)
			return NextResponse.json(
				{ 
					error: "Failed to save passkey. Please try again.",
					code: "PASSKEY_STORAGE_FAILED"
				},
				{ status: 500 }
			)
		}
		
		// Prepare response
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
		response.cookies.delete("passkey_user_data")
		response.cookies.delete("passkey_user_id")
		
		// Store authentication token only for new users
		// Existing users keep their session
		if (!existingUserId) {
			response.cookies.set("auth_token", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 60 * 60 * 24 * 30, // 30 days
			})
		}
		
		return response
	} catch (error) {
		console.error("Passkey verification error:", error)
		
		// Provide more specific error messages
		if (error instanceof Error) {
			if (error.message.includes("challenge")) {
				return NextResponse.json(
					{ 
						error: "Registration session expired. Please start over.",
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
				error: "Failed to verify registration",
				code: "VERIFICATION_ERROR"
			},
			{ status: 500 }
		)
	}
}

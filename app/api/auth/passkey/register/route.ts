/**
 * Passkey Registration API
 * 
 * Generates WebAuthn registration options for a new passkey.
 * Supports both new user registration and adding passkeys to existing accounts
 * (when user is authenticated).
 * 
 * @route POST /api/auth/passkey/register
 */

import { NextRequest, NextResponse } from "next/server"
import { generateRegistrationOptions } from "@simplewebauthn/server"
import { env } from "@/lib/env"
import { findUserByEmail, findUserByToken } from "@/lib/services/auth.service"

const rpName = "DuoSync"
const rpID = new URL(env.NEXTAUTH_URL).hostname
const origin = env.NEXTAUTH_URL

export async function POST(request: NextRequest) {
	try {
		const { email, name } = await request.json()
		const authToken = request.cookies.get("auth_token")?.value
		
		// If user is already authenticated, use their data as fallback
		let userData = { name: "", email: "" }
		if (authToken) {
			const user = await findUserByToken(authToken)
			if (user) {
				userData = {
					name: user.name,
					email: user.email || "",
				}
			}
		}
		
		// Use provided data or authenticated user data
		const finalName = name || userData.name
		const finalEmail = email || userData.email
		
		if (!finalName) {
			return NextResponse.json(
				{ 
					error: "Name is required",
					code: "MISSING_NAME"
				},
				{ status: 400 }
			)
		}
		
		// Validate name length
		if (finalName.length < 2) {
			return NextResponse.json(
				{ 
					error: "Name must be at least 2 characters long",
					code: "INVALID_NAME"
				},
				{ status: 400 }
			)
		}
		
		// Validate email format if provided
		if (finalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
			return NextResponse.json(
				{ 
					error: "Invalid email format",
					code: "INVALID_EMAIL"
				},
				{ status: 400 }
			)
		}
		
		// Check if user already exists (only for new registrations, not authenticated users)
		if (!authToken && finalEmail) {
			const existingUser = await findUserByEmail(finalEmail)
			if (existingUser) {
				return NextResponse.json(
					{ 
						error: "An account with this email already exists. Please sign in instead.",
						code: "USER_EXISTS"
					},
					{ status: 409 }
				)
			}
		}
		
		// Generate WebAuthn registration options
		// requireResidentKey: true makes the passkey "discoverable" (can be found without email)
		// Essential for password managers like Bitwarden
		const options = await generateRegistrationOptions({
			rpName,
			rpID,
			userName: finalEmail || finalName,
			userDisplayName: finalName,
			userID: Buffer.from(finalEmail || finalName), // Must be stable and unique
			timeout: 60000,
			attestationType: "none",
			supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
			authenticatorSelection: {
				authenticatorAttachment: "cross-platform", // Support both platform and cross-platform
				userVerification: "preferred",
				requireResidentKey: true, // REQUIRED for discoverable credentials (password managers)
			},
		})
		
		// Store challenge and user data in cookies for subsequent verification
		const response = NextResponse.json(options)
		response.cookies.set("passkey_challenge", options.challenge, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 600, // 10 minutes
		})
		response.cookies.set("passkey_user_data", JSON.stringify({ name: finalName, email: finalEmail }), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 600,
		})
		
		// If user is authenticated AND is adding a passkey (not new registration),
		// store their ID to associate the passkey with their account
		// This allows distinguishing between new registration and adding passkey
		const isAddingPasskey = request.headers.get("x-add-passkey") === "true"
		if (authToken && isAddingPasskey) {
			const user = await findUserByToken(authToken)
			if (user) {
				response.cookies.set("passkey_user_id", user.id.toString(), {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					maxAge: 600,
				})
			}
		}
		
		return response
	} catch (error) {
		console.error("Passkey registration error:", error)
		
		// Provide more specific error messages
		if (error instanceof Error) {
			if (error.message.includes("rpID")) {
				return NextResponse.json(
					{ 
						error: "Invalid domain configuration",
						code: "INVALID_RPID"
					},
					{ status: 500 }
				)
			}
		}
		
		return NextResponse.json(
			{ 
				error: "Failed to generate registration options",
				code: "REGISTRATION_ERROR"
			},
			{ status: 500 }
		)
	}
}

/**
 * Passkey Discover API
 * 
 * Generates authentication options for discoverable credentials.
 * Allows browser/password manager to find all available passkeys for this domain
 * without requiring the user's email.
 * 
 * Essential for password managers like Bitwarden to work correctly.
 * 
 * @route POST /api/auth/passkey/discover
 */

import { NextRequest, NextResponse } from "next/server"
import { generateAuthenticationOptions } from "@simplewebauthn/server"
import { env } from "@/lib/env"

const rpID = new URL(env.NEXTAUTH_URL).hostname

export async function POST(request: NextRequest) {
	try {
		// Generate authentication options for discoverable credentials
		// By not specifying allowCredentials (or using empty array), the browser/password manager
		// will search for all discoverable passkeys registered for this rpID
		const options = await generateAuthenticationOptions({
			rpID,
			// Empty array allows discovery of all passkeys for this domain
			// Independent of email - password managers will show all available passkeys
			allowCredentials: [],
			userVerification: "preferred",
			timeout: 60000,
		})
		
		// Store challenge in cookie for subsequent verification
		const response = NextResponse.json(options)
		response.cookies.set("passkey_challenge", options.challenge, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 600, // 10 minutes
		})
		
		return response
	} catch (error) {
		console.error("Passkey discover error:", error)
		
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
				error: "Failed to generate authentication options",
				code: "DISCOVER_ERROR"
			},
			{ status: 500 }
		)
	}
}

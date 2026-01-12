/**
 * Magic Link Verification API
 * 
 * Verifies magic link token and creates a session for the user.
 * If user has no saved passkeys, redirects to dashboard with a prompt
 * to suggest registering a passkey on the new device.
 * 
 * @route GET /api/auth/magic-link/verify
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verificationTokens } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { findUserByEmail, getUserPasskeys } from "@/lib/services/auth.service"

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const token = searchParams.get("token")
		const email = searchParams.get("email")
		
		if (!token || !email) {
			return NextResponse.json(
				{ 
					error: "Missing token or email",
					code: "MISSING_PARAMS"
				},
				{ status: 400 }
			)
		}
		
		// Find valid verification token
		const [verificationToken] = await db
			.select()
			.from(verificationTokens)
			.where(
				and(
					eq(verificationTokens.identifier, email),
					eq(verificationTokens.token, token),
					gt(verificationTokens.expires, new Date())
				)
			)
			.limit(1)
		
		if (!verificationToken) {
			return NextResponse.json(
				{ 
					error: "Invalid or expired magic link. Please request a new one.",
					code: "INVALID_TOKEN"
				},
				{ status: 400 }
			)
		}
		
		// Find user
		const user = await findUserByEmail(email)
		if (!user) {
			return NextResponse.json(
				{ 
					error: "User account not found",
					code: "USER_NOT_FOUND"
				},
				{ status: 404 }
			)
		}
		
		// Delete used token (prevent reuse)
		try {
			await db.delete(verificationTokens).where(
				eq(verificationTokens.token, token)
			)
		} catch (err) {
			console.error("Token deletion error:", err)
			// Continue even if deletion fails
		}
		
		// Check if user has saved passkeys
		const passkeys = await getUserPasskeys(user.id)
		const hasPasskeys = passkeys.length > 0
		
		// Determine redirect URL
		// If no passkeys, show prompt to register one
		const redirectUrl = hasPasskeys 
			? "/dashboard" 
			: `/dashboard?promptPasskey=true&email=${encodeURIComponent(email)}`
		
		const response = NextResponse.redirect(new URL(redirectUrl, request.url))
		
		// Store authentication token in cookie
		response.cookies.set("auth_token", user.token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30, // 30 days
		})
		
		return response
	} catch (error) {
		console.error("Magic link verification error:", error)
		
		// Provide more specific error messages
		if (error instanceof Error) {
			if (error.message.includes("database") || error.message.includes("connection")) {
				return NextResponse.json(
					{ 
						error: "Database error. Please try again later.",
						code: "DATABASE_ERROR"
					},
					{ status: 500 }
				)
			}
		}
		
		return NextResponse.json(
			{ 
				error: "Failed to verify magic link. Please try again.",
				code: "VERIFICATION_ERROR"
			},
			{ status: 500 }
		)
	}
}

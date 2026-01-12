/**
 * Magic Link Request API
 * 
 * Generates and sends a magic link via email to allow access on other devices.
 * The magic link allows access without passkey, useful for devices that don't support
 * WebAuthn or for accessing from devices where a passkey hasn't been saved yet.
 * 
 * @route POST /api/auth/magic-link/request
 */

import { NextRequest, NextResponse } from "next/server"
import { findUserByEmail } from "@/lib/services/auth.service"
import { sendMagicLinkEmail } from "@/lib/services/email.service"
import { randomUUID } from "crypto"
import { db } from "@/lib/db"
import { verificationTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { env } from "@/lib/env"

export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json()
		
		if (!email) {
			return NextResponse.json(
				{ 
					error: "Email is required",
					code: "MISSING_EMAIL"
				},
				{ status: 400 }
			)
		}
		
		// Validate email format
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return NextResponse.json(
				{ 
					error: "Invalid email format",
					code: "INVALID_EMAIL"
				},
				{ status: 400 }
			)
		}
		
		// Find user by email
		const user = await findUserByEmail(email)
		if (!user) {
			// Don't reveal if user exists (security best practice)
			return NextResponse.json({
				success: true,
				message: "If an account exists, a magic link has been sent",
			})
		}
		
		// Generate unique verification token
		const token = randomUUID()
		const expires = new Date()
		expires.setHours(expires.getHours() + 1) // Expires after 1 hour
		
		// Delete existing tokens for this email
		await db.delete(verificationTokens).where(
			eq(verificationTokens.identifier, email)
		)
		
		// Store new token
		await db.insert(verificationTokens).values({
			identifier: email,
			token,
			expires,
		})
		
		// Generate magic link URL
		const magicLink = `${env.NEXTAUTH_URL}/login?token=${token}&email=${encodeURIComponent(email)}`
		
		// Send magic link email via Mailpit/SMTP
		try {
			await sendMagicLinkEmail(email, token)
		} catch (emailError) {
			console.error("Email sending error:", emailError)
			// Don't fail the request if email fails - user might still receive it
			// But log the error for monitoring
		}
		
		return NextResponse.json({
			success: true,
			message: "If an account exists, a magic link has been sent",
		})
	} catch (error) {
		console.error("Magic link request error:", error)
		
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
				error: "Failed to send magic link. Please try again.",
				code: "MAGIC_LINK_ERROR"
			},
			{ status: 500 }
		)
	}
}

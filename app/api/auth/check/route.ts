/**
 * Auth Check API
 * 
 * Checks if user is authenticated via token cookie.
 * Returns user information if authenticated, otherwise false.
 * 
 * @route GET /api/auth/check
 */

import { NextRequest, NextResponse } from "next/server"
import { findUserByToken, getUserPasskeys } from "@/lib/services/auth.service"

export async function GET(request: NextRequest) {
	try {
		const token = request.cookies.get("auth_token")?.value
		
		if (!token) {
			return NextResponse.json({ authenticated: false })
		}
		
		const user = await findUserByToken(token)
		
		if (!user) {
			// Clear invalid token
			const response = NextResponse.json({ authenticated: false })
			response.cookies.delete("auth_token")
			return response
		}
		
		// Check if user has passkeys (for prompt in dashboard)
		const passkeys = await getUserPasskeys(user.id)
		
		return NextResponse.json({
			authenticated: true,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
			},
			hasPasskeys: passkeys.length > 0,
		})
	} catch (error) {
		console.error("Auth check error:", error)
		
		// Provide more specific error messages
		if (error instanceof Error) {
			if (error.message.includes("database") || error.message.includes("connection")) {
				return NextResponse.json(
					{ 
						authenticated: false,
						error: "Database error",
						code: "DATABASE_ERROR"
					},
					{ status: 500 }
				)
			}
		}
		
		return NextResponse.json({ authenticated: false })
	}
}

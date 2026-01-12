/**
 * Logout API
 * 
 * Deletes authentication token from cookie, logging out the user.
 * 
 * @route POST /api/auth/logout
 */

import { NextResponse } from "next/server"

export async function POST() {
	const response = NextResponse.json({ success: true })
	response.cookies.delete("auth_token")
	return response
}

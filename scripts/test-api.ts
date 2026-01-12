/**
 * API Testing Script
 * 
 * Quick script to test API endpoints
 * Usage: tsx scripts/test-api.ts
 */

import { createUser } from "@/lib/services/auth.service"
import { createInterval } from "@/lib/services/intervals.service"
import { calculateTimeline } from "@/lib/services/timeline.service"

async function testAPI() {
	console.log("🧪 Testing API endpoints...\n")

	try {
		// Create test user
		console.log("1. Creating test user...")
		const { user, token } = await createUser("Test User", "test-api@example.com")
		console.log(`   ✅ User created: ID ${user.id}, Token: ${token.substring(0, 8)}...\n`)

		// Test timeline calculation
		console.log("2. Testing timeline calculation (empty)...")
		const emptyTimeline = await calculateTimeline("2024-01-15", [user.id], "UTC")
		console.log(`   ✅ Timeline calculated: ${emptyTimeline.length} segments`)
		console.log(`   First segment: ${JSON.stringify(emptyTimeline[0])}\n`)

		// Create an interval
		console.log("3. Creating test interval...")
		const interval = await createInterval({
			userId: user.id,
			startTs: new Date("2024-01-15T10:00:00Z"),
			endTs: new Date("2024-01-15T12:00:00Z"),
			category: "busy",
			description: "Test meeting",
		})
		console.log(`   ✅ Interval created: ID ${interval.id}\n`)

		// Test timeline with interval
		console.log("4. Testing timeline calculation (with interval)...")
		const timeline = await calculateTimeline("2024-01-15", [user.id], "UTC")
		console.log(`   ✅ Timeline calculated: ${timeline.length} segments`)
		timeline.forEach((segment, i) => {
			console.log(`   Segment ${i + 1}: ${segment.start}-${segment.end} (${segment.category})`)
		})
		console.log()

		// Test timezone conversion
		console.log("5. Testing timezone conversion (Europe/Rome)...")
		const timelineRome = await calculateTimeline("2024-01-15", [user.id], "Europe/Rome")
		console.log(`   ✅ Timeline calculated: ${timelineRome.length} segments`)
		timelineRome.forEach((segment, i) => {
			console.log(`   Segment ${i + 1}: ${segment.start}-${segment.end} (${segment.category})`)
		})
		console.log()

		console.log("✅ All tests passed!")
		console.log(`\n📝 To test API endpoints manually:`)
		console.log(`   1. Start the dev server: pnpm dev`)
		console.log(`   2. Login to get auth_token cookie`)
		console.log(`   3. Test GET /api/timeline?date=2024-01-15&userIds=${user.id}`)
		console.log(`   4. Test GET /api/intervals?date=2024-01-15`)
		console.log(`   5. Test POST /api/intervals with interval data`)
	} catch (error) {
		console.error("❌ Test failed:", error)
		process.exit(1)
	}
}

testAPI()

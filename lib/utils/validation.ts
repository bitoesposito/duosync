/**
 * Validation Schemas
 * 
 * Zod schemas for input validation
 */

import { z } from "zod"

// Recurrence rule validation
export const recurrenceRuleSchema = z.object({
	type: z.enum(["weekly", "daily"]),
	daysOfWeek: z.array(z.number().min(1).max(7)).min(1), // At least one day
	until: z.string().nullable().optional(),
})

// Interval creation/update validation
export const intervalSchema = z.object({
	start_ts: z.string().datetime(), // ISO 8601 timestamp
	end_ts: z.string().datetime(), // ISO 8601 timestamp
	category: z.enum(["sleep", "busy", "other"]),
	description: z.string().nullable().optional(),
	recurrence_rule: recurrenceRuleSchema.nullable().optional(),
}).refine(
	(data) => {
		// end_ts must be after start_ts
		return new Date(data.end_ts) > new Date(data.start_ts)
	},
	{
		message: "end_ts must be after start_ts",
		path: ["end_ts"],
	}
).refine(
	(data) => {
		// Duration must be <= 24 hours
		const start = new Date(data.start_ts)
		const end = new Date(data.end_ts)
		const diffMs = end.getTime() - start.getTime()
		const maxDurationMs = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
		return diffMs <= maxDurationMs
	},
	{
		message: "Interval duration must be <= 24 hours",
		path: ["end_ts"],
	}
)

// Timeline query validation
export const timelineQuerySchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
	userIds: z.string().transform((val) => {
		// Comma-separated string to array of numbers
		return val.split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id))
	}),
})

// Connection request validation
export const connectionRequestSchema = z.object({
	addresseeId: z.number().int().positive(),
})

// Connection visibility update validation
export const connectionVisibilitySchema = z.object({
	canSeeAppointments: z.boolean(),
})

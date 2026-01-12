/**
 * Validation Schemas
 * 
 * Zod schemas for input validation
 */

import { z } from "zod"

// Recurrence rule validation
export const recurrenceRuleSchema = z.object({
	type: z.enum(["weekly", "daily", "monthly"]),
	daysOfWeek: z.array(z.number().min(1).max(7)).min(1), // At least one day
	until: z.string().nullable().optional(),
	// Monthly-specific (mutually exclusive)
	dayOfMonth: z.number().min(-1).max(31).optional(),
	byWeekday: z.string().optional(),
}).refine(
	(data) => {
		// Monthly must have either dayOfMonth or byWeekday, but not both
		if (data.type === "monthly") {
			const hasDayOfMonth = data.dayOfMonth !== undefined
			const hasByWeekday = data.byWeekday !== undefined
			return hasDayOfMonth !== hasByWeekday // XOR
		}
		return true
	},
	{
		message: "Monthly recurrence must have either dayOfMonth or byWeekday, but not both",
	}
)

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
		// Duration must be <= 7 days
		const start = new Date(data.start_ts)
		const end = new Date(data.end_ts)
		const diffMs = end.getTime() - start.getTime()
		const diffDays = diffMs / (1000 * 60 * 60 * 24)
		return diffDays <= 7
	},
	{
		message: "Interval duration must be <= 7 days",
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

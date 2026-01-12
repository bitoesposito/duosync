/**
 * Global Type Definitions
 * 
 * Type definitions shared across the application
 */

// Interval types
export interface Interval {
	id: number
	userId: number
	startTs: Date
	endTs: Date
	category: "sleep" | "busy" | "other"
	description?: string | null
	recurrenceRule?: RecurrenceRule | null
	createdAt: Date
	updatedAt: Date
}

// Recurrence rule types
export interface RecurrenceRule {
	type: "weekly" | "daily" | "monthly"
	daysOfWeek: number[] // 1=Monday, 7=Sunday
	until?: string | null // ISO timestamp, null = infinite
	// Monthly-specific fields (mutually exclusive)
	dayOfMonth?: number // 1-31, or -1/"last" for last day of month
	byWeekday?: string // "first-monday", "last-friday", etc.
}

export interface RecurrenceException {
	id: number
	recurrenceId: number
	exceptionDate: Date
	modifiedInterval?: ModifiedInterval | null
	createdAt: Date
}

export interface ModifiedInterval {
	start_ts: string // ISO timestamp
	end_ts: string // ISO timestamp
	category: "sleep" | "busy" | "other"
}

// Connection types
export interface UserConnection {
	id: number
	requesterId: number
	addresseeId: number
	status: "pending" | "accepted" | "blocked"
	canSeeAppointments: boolean
	createdAt: Date
	updatedAt: Date
}

// Timeline types
export interface TimelineSegment {
	start: string // HH:mm format (already converted to user timezone)
	end: string // HH:mm format
	category: "match" | "sleep" | "busy" | "other"
}

// User types
export interface User {
	id: number
	email?: string | null
	emailVerified?: Date | null
	name: string
	token: string
	timezone: string
	createdAt: Date
	updatedAt: Date
}

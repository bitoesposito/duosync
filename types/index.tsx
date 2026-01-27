/**
 * Global Type Definitions
 * 
 * Core domain types for DuoSync
 */

export interface Interval {
	id?: number
	userId: number
	startTs: Date
	endTs: Date
	category: "sleep" | "busy" | "other"
	description?: string | null
	recurrenceRule?: RecurrenceRule | null
}

export interface RecurrenceRule {
	type: "daily" | "weekly"
	daysOfWeek?: number[] // 1-7 (Monday=1, Sunday=7)
	until?: string | Date // ISO date string or Date object
}

export interface User {
	id: number
	email?: string | null
	name: string
	token: string
	timezone: string
	createdAt: Date
	updatedAt: Date
}

export interface Connection {
	id: number
	requesterId: number
	addresseeId: number
	status: "pending" | "accepted" | "blocked"
	canSeeAppointments: boolean
	createdAt: Date
	updatedAt: Date
}

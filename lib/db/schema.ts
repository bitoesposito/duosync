/**
 * Database Schema - Drizzle ORM
 * 
 * Schema completo per DuoSync con NextAuth v5 integration
 */

import { pgTable, serial, integer, text, timestamp, jsonb, boolean, check, unique, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { relations } from "drizzle-orm"

// NextAuth v5 tables (auto-generated, ma definiamo la struttura per estendere)
export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	email: text("email").unique(),
	emailVerified: timestamp("email_verified", { withTimezone: true }),
	name: text("name").notNull(),
	token: text("token").unique().notNull(), // Initial login token (UUID v4)
	timezone: text("timezone").default("UTC").notNull(), // User timezone
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// NextAuth accounts table
export const accounts = pgTable("accounts", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	type: text("type").notNull(),
	provider: text("provider").notNull(),
	providerAccountId: text("provider_account_id").notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text("scope"),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => ({
	uniqueProviderAccount: unique().on(table.provider, table.providerAccountId),
}))

// NextAuth sessions table
export const sessions = pgTable("sessions", {
	id: serial("id").primaryKey(),
	sessionToken: text("session_token").unique().notNull(),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	expires: timestamp("expires", { withTimezone: true }).notNull(),
})

// NextAuth verification tokens table
export const verificationTokens = pgTable("verification_tokens", {
	identifier: text("identifier").notNull(),
	token: text("token").notNull(),
	expires: timestamp("expires", { withTimezone: true }).notNull(),
}, (table) => ({
	uniqueToken: unique().on(table.identifier, table.token),
}))

// User connections (friendship system)
export const userConnections = pgTable("user_connections", {
	id: serial("id").primaryKey(),
	requesterId: integer("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	addresseeId: integer("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	status: text("status").notNull().$type<"pending" | "accepted" | "blocked">(), // 'pending' | 'accepted' | 'blocked'
	canSeeAppointments: boolean("can_see_appointments").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
	uniqueConnection: unique().on(table.requesterId, table.addresseeId),
	requesterStatusIdx: index("user_connections_requester_status_idx").on(table.requesterId, table.status),
	addresseeStatusIdx: index("user_connections_addressee_status_idx").on(table.addresseeId, table.status),
}))

// Busy intervals (core domain entity)
export const busyIntervals = pgTable("busy_intervals", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	startTs: timestamp("start_ts", { withTimezone: true }).notNull(),
	endTs: timestamp("end_ts", { withTimezone: true }).notNull(),
	category: text("category").notNull().$type<"sleep" | "busy" | "other">(), // 'sleep' | 'busy' | 'other'
	description: text("description"), // nullable
	recurrenceRule: jsonb("recurrence_rule"), // nullable, JSONB structure
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
	// CHECK constraint: end_ts > start_ts
	endAfterStart: check("end_after_start", sql`${table.endTs} > ${table.startTs}`),
	// CHECK constraint: max 24 hours
	maxDuration: check("max_duration", sql`${table.endTs} - ${table.startTs} <= INTERVAL '24 hours'`),
	// Indexes for performance
	rangeIdx: index("busy_intervals_range_idx").on(table.startTs, table.endTs),
	userIdIdx: index("busy_intervals_user_id_idx").on(table.userId),
	// GIST index for advanced range queries (created via migration)
	// CREATE INDEX busy_intervals_range_gist_idx ON busy_intervals USING GIST (tstzrange(start_ts, end_ts));
}))

// Recurrence exceptions
export const recurrenceExceptions = pgTable("recurrence_exceptions", {
	id: serial("id").primaryKey(),
	recurrenceId: integer("recurrence_id")
		.notNull()
		.references(() => busyIntervals.id, { onDelete: "cascade" }),
	exceptionDate: timestamp("exception_date", { mode: "date" }).notNull(), // Date specifica da escludere
	modifiedInterval: jsonb("modified_interval"), // Opzionale: intervallo modificato per quella data
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
	uniqueRecurrenceDate: unique().on(table.recurrenceId, table.exceptionDate),
}))

// Passkey credentials (WebAuthn)
export const passkeyCredentials = pgTable("passkey_credentials", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	credentialId: text("credential_id").unique().notNull(), // Base64URL encoded credential ID
	publicKey: text("public_key").notNull(), // Base64URL encoded public key
	counter: integer("counter").default(0).notNull(), // Counter for replay protection
	deviceType: text("device_type"), // "singleDevice" | "multiDevice" | "crossPlatform"
	transports: text("transports"), // Comma-separated: "usb,nfc,ble,internal"
	name: text("name"), // User-friendly name for the credential
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
}, (table) => ({
	userIdIdx: index("passkey_credentials_user_id_idx").on(table.userId),
	credentialIdIdx: index("passkey_credentials_credential_id_idx").on(table.credentialId),
}))

// Push subscriptions (for notifications)
export const pushSubscriptions = pgTable("push_subscriptions", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	endpoint: text("endpoint").unique().notNull(),
	p256dh: text("p256dh").notNull(),
	auth: text("auth").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
	userIdIdx: index("push_subscriptions_user_id_idx").on(table.userId),
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	intervals: many(busyIntervals),
	connectionsAsRequester: many(userConnections, { relationName: "requester" }),
	connectionsAsAddressee: many(userConnections, { relationName: "addressee" }),
	accounts: many(accounts),
	sessions: many(sessions),
	passkeyCredentials: many(passkeyCredentials),
	pushSubscriptions: many(pushSubscriptions),
}))

export const passkeyCredentialsRelations = relations(passkeyCredentials, ({ one }) => ({
	user: one(users, {
		fields: [passkeyCredentials.userId],
		references: [users.id],
	}),
}))

export const busyIntervalsRelations = relations(busyIntervals, ({ one, many }) => ({
	user: one(users, {
		fields: [busyIntervals.userId],
		references: [users.id],
	}),
	recurrenceExceptions: many(recurrenceExceptions),
}))

export const userConnectionsRelations = relations(userConnections, ({ one }) => ({
	requester: one(users, {
		fields: [userConnections.requesterId],
		references: [users.id],
		relationName: "requester",
	}),
	addressee: one(users, {
		fields: [userConnections.addresseeId],
		references: [users.id],
		relationName: "addressee",
	}),
}))

export const recurrenceExceptionsRelations = relations(recurrenceExceptions, ({ one }) => ({
	recurrence: one(busyIntervals, {
		fields: [recurrenceExceptions.recurrenceId],
		references: [busyIntervals.id],
	}),
}))

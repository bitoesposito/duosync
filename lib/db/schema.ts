import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  date,
  boolean,
  jsonb,
  check,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Database schema for DuoSync
 * 
 * NextAuth v5 requires these tables:
 * - accounts (OAuth provider accounts)
 * - sessions (User sessions)
 * - verification_tokens (Email magic link tokens)
 * 
 * We extend the users table and add domain-specific tables.
 */

// Extended users table (extends NextAuth users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(), // Required for account recovery
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  name: text("name").notNull(),
  token: text("token").notNull().unique(), // Initial login token (stored in passkey)
  timezone: text("timezone").notNull().default("UTC"), // User timezone
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// NextAuth required tables
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "oauth" | "email" | "credentials"
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
  userIdIdx: index("accounts_user_id_idx").on(table.userId),
}));

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIdx: index("sessions_user_id_idx").on(table.userId),
  sessionTokenIdx: index("sessions_session_token_idx").on(table.sessionToken),
}));

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
}, (table) => ({
  uniqueToken: unique().on(table.identifier, table.token),
}));

// Passkeys table (WebAuthn credentials)
export const passkeys = pgTable(
  "passkeys",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialId: text("credential_id").notNull().unique(), // Base64url encoded credential ID
    publicKey: text("public_key").notNull(), // Base64url encoded public key
    counter: integer("counter").notNull().default(0), // Signature counter
    deviceType: text("device_type"), // "platform" | "cross-platform"
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("passkeys_user_id_idx").on(table.userId),
    credentialIdIdx: index("passkeys_credential_id_idx").on(table.credentialId),
  })
);

// User connections (friendship system)
export const userConnections = pgTable(
  "user_connections",
  {
    id: serial("id").primaryKey(),
    requesterId: integer("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: integer("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull(), // 'pending' | 'accepted' | 'blocked'
    canSeeAppointments: boolean("can_see_appointments").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: can't have duplicate connections
    uniqueConnection: unique().on(table.requesterId, table.addresseeId),
    // Indexes for efficient queries
    requesterStatusIdx: index("user_connections_requester_status_idx").on(
      table.requesterId,
      table.status
    ),
    addresseeStatusIdx: index("user_connections_addressee_status_idx").on(
      table.addresseeId,
      table.status
    ),
  })
);

// Busy intervals (core domain entity)
export const busyIntervals = pgTable(
  "busy_intervals",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startTs: timestamp("start_ts", { withTimezone: true }).notNull(),
    endTs: timestamp("end_ts", { withTimezone: true }).notNull(),
    category: text("category").notNull(), // 'sleep' | 'busy' | 'other'
    description: text("description"), // Nullable
    recurrenceRule: jsonb("recurrence_rule"), // Nullable, JSONB structure
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // CHECK constraint: end_ts must be after start_ts
    endAfterStart: check("end_after_start", sql`${table.endTs} > ${table.startTs}`),
    // CHECK constraint: max duration 7 days
    maxDuration: check(
      "max_duration",
      sql`${table.endTs} - ${table.startTs} <= INTERVAL '7 days'`
    ),
    // Index for range queries (fundamental for timeline calculation)
    rangeIdx: index("busy_intervals_range_idx").on(table.startTs, table.endTs),
    // Index for user queries
    userIdIdx: index("busy_intervals_user_id_idx").on(table.userId),
  })
);

// Recurrence exceptions (modifications/deletions for specific dates)
export const recurrenceExceptions = pgTable(
  "recurrence_exceptions",
  {
    id: serial("id").primaryKey(),
    recurrenceId: integer("recurrence_id")
      .notNull()
      .references(() => busyIntervals.id, { onDelete: "cascade" }),
    exceptionDate: date("exception_date").notNull(), // Specific date to exclude/modify
    modifiedInterval: jsonb("modified_interval"), // Optional: modified interval for that date
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: one exception per recurrence per date
    uniqueRecurrenceDate: unique().on(table.recurrenceId, table.exceptionDate),
  })
);

// Push subscriptions (for browser notifications)
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Index for user queries
    userIdIdx: index("push_subscriptions_user_id_idx").on(table.userId),
  })
);

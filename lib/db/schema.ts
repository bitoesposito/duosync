import { pgTable, serial, text, date, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// App settings table: stores global configuration (admin pin, initialization state)
export const appSettings = pgTable("app_settings", {
  id: integer("id").primaryKey().default(1), // Single row table
  adminPin: text("adminPin").notNull(), // Hashed or plain (simple protection)
  isInitialized: boolean("isInitialized").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Users table: stores user profiles
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Appointments table: stores one-time appointments for specific users and dates
export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  date: date("date").notNull(),
  startTime: text("startTime").notNull(), // HH:mm format
  endTime: text("endTime").notNull(), // HH:mm format
  category: text("category").notNull(), // "sleep" | "other"
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Recurring appointments table: stores recurring appointment templates
// These are applied to specific days of the week for a user
export const recurringAppointments = pgTable("recurring_appointments", {
  id: text("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  startTime: text("startTime").notNull(), // HH:mm format
  endTime: text("endTime").notNull(), // HH:mm format
  category: text("category").notNull(), // "sleep" | "other"
  description: text("description"),
  repeatDays: text("repeatDays").array().notNull(), // Array of day IDs (1-7) - days of the week
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Push subscriptions table: stores push notification subscriptions for users
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(), // Public key for encryption
  auth: text("auth").notNull(), // Auth secret for encryption
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Indexes for efficient queries
export const appointmentsUserIdDateIndex = sql`CREATE INDEX IF NOT EXISTS appointments_userId_date_idx ON appointments("userId", "date")`;
export const recurringAppointmentsUserIdIndex = sql`CREATE INDEX IF NOT EXISTS recurring_appointments_userId_idx ON recurring_appointments("userId")`;
export const pushSubscriptionsUserIdIndex = sql`CREATE INDEX IF NOT EXISTS push_subscriptions_userId_idx ON push_subscriptions("userId")`;
export const pushSubscriptionsEndpointIndex = sql`CREATE INDEX IF NOT EXISTS push_subscriptions_endpoint_idx ON push_subscriptions("endpoint")`;


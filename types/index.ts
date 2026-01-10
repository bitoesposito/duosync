/**
 * Global domain types
 * All global domain types are exported from here
 */

import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  users,
  userConnections,
  busyIntervals,
  recurrenceExceptions,
  pushSubscriptions,
} from "@/lib/db/schema";

// User types
export type User = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>;

// User connection types
export type UserConnection = InferSelectModel<typeof userConnections>;
export type UserConnectionInsert = InferInsertModel<typeof userConnections>;
export type ConnectionStatus = "pending" | "accepted" | "blocked";

// Busy interval types
export type BusyInterval = InferSelectModel<typeof busyIntervals>;
export type BusyIntervalInsert = InferInsertModel<typeof busyIntervals>;
export type IntervalCategory = "sleep" | "busy" | "other";

// Recurrence rule types
export type RecurrenceRule =
  | WeeklyRecurrenceRule
  | DailyRecurrenceRule
  | MonthlyRecurrenceRule;

export interface BaseRecurrenceRule {
  type: "weekly" | "daily" | "monthly";
  daysOfWeek: number[]; // 1=Monday, 7=Sunday
  until: string | null; // ISO timestamp or null for infinite
}

export interface WeeklyRecurrenceRule extends BaseRecurrenceRule {
  type: "weekly";
}

export interface DailyRecurrenceRule extends BaseRecurrenceRule {
  type: "daily";
}

export interface MonthlyRecurrenceRule extends BaseRecurrenceRule {
  type: "monthly";
  dayOfMonth?: number; // 1-31, or -1/"last" for last day of month
  byWeekday?: string; // "first-monday", "last-friday", etc.
}

// Recurrence exception types
export type RecurrenceException = InferSelectModel<typeof recurrenceExceptions>;
export type RecurrenceExceptionInsert = InferInsertModel<typeof recurrenceExceptions>;

export interface ModifiedInterval {
  start_ts?: string; // ISO timestamp
  end_ts?: string; // ISO timestamp
  category?: IntervalCategory;
}

// Push subscription types
export type PushSubscription = InferSelectModel<typeof pushSubscriptions>;
export type PushSubscriptionInsert = InferInsertModel<typeof pushSubscriptions>;

/**
 * D1 (SQLite) schema via Drizzle. Two appointment tables (one-time + recurring),
 * mirroring the legacy Postgres design minus the cut features.
 * - serial → autoincrement integer PK
 * - text[] repeatDays → JSON-encoded number[] text column
 * - date/timestamp → ISO text
 */

import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { DayId } from "../shared/types";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const appointments = sqliteTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    startTime: text("start_time").notNull(), // HH:mm
    endTime: text("end_time").notNull(), // HH:mm (23:59 = end of day)
    category: text("category", { enum: ["sleep", "other"] }).notNull(),
    description: text("description"),
  },
  (t) => [index("appointments_user_date_idx").on(t.userId, t.date)],
);

export const recurringAppointments = sqliteTable(
  "recurring_appointments",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    category: text("category", { enum: ["sleep", "other"] }).notNull(),
    description: text("description"),
    repeatDays: text("repeat_days", { mode: "json" }).$type<DayId[]>().notNull(),
  },
  (t) => [index("recurring_user_idx").on(t.userId)],
);

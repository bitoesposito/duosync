/**
 * GET /api/users — list users (seeded).
 * Read-only by design: users are seeded for the demo. To make them
 * visitor-manageable, add onRequestPost (create, reject at MAX_USERS) and
 * onRequestDelete here — the validation helper already exports MAX_USERS.
 */

import { drizzle } from "drizzle-orm/d1";
import { users } from "../../db/schema";

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const db = drizzle(env.DB);
  const rows = await db.select().from(users).orderBy(users.id);
  return Response.json(rows.map((u) => ({ id: u.id, name: u.name })));
};

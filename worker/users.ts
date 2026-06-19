import { drizzle } from "drizzle-orm/d1";
import { users } from "../db/schema";
import type { Env } from "./env";

/** GET /api/users — list users (seeded). Read-only by design. */
export async function handleUsers(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
  const db = drizzle(env.DB);
  const rows = await db.select().from(users).orderBy(users.id);
  return Response.json(rows.map((u) => ({ id: u.id, name: u.name })));
}

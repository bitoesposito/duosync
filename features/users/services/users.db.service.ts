import { db, schema } from "@/lib/db";
import { UserProfile } from "@/types";
import { desc } from "drizzle-orm";

/**
 * Fetches all users directly from database.
 * For use in Server Components.
 */
export async function getUsersFromDb(): Promise<UserProfile[]> {
  const result = await db
    .select()
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt));
    
  return result.map((user) => ({
    id: user.id,
    name: user.name,
  }));
}


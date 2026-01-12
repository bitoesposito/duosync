/**
 * Database Connection
 * 
 * Drizzle ORM connection setup
 */

import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"
import { env } from "@/lib/env"

// Create PostgreSQL connection pool
const pool = new Pool({
	connectionString: env.DATABASE_URL,
})

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema })

// Export schema for use in other files
export * from "./schema"

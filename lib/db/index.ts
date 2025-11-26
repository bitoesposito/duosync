import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * PostgreSQL connection pool.
 * Uses DATABASE_URL environment variable for connection string.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Drizzle database instance with schema.
 * Used for all database operations throughout the application.
 */
export const db = drizzle(pool, { schema });

/**
 * Database schema exports.
 * Contains table definitions and types.
 */
export { schema };

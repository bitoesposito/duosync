import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "../lib/db/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function runMigrations() {
  console.log("Running migrations...");
  try {
    // Use push for development (creates tables directly from schema)
    // This is simpler than managing migration files for dev
    await db.execute(
      schema.appointmentsUserIdDateIndex
    );
    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
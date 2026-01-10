/**
 * Database migration script
 * Run migrations programmatically using drizzle-orm
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { env } from "../env";
import { existsSync } from "fs";
import { join } from "path";

async function runMigrations() {
  const migrationsFolder = join(process.cwd(), "lib/db/migrations");
  const journalPath = join(migrationsFolder, "meta/_journal.json");

  // Check if migrations exist
  if (!existsSync(journalPath)) {
    console.warn("⚠️  No migrations found!");
    console.warn("⚠️  This usually means migrations were deleted or not committed to the repository.");
    console.warn("⚠️  Migrations should be part of the codebase and committed to git.");
    console.warn("⚠️  Skipping migration step.");
    console.warn("⚠️  If you need to regenerate migrations, run: pnpm db:generate");
    console.warn("⚠️  Then commit the generated migrations to the repository.");
    // Don't exit with error - allow the app to start even without migrations
    // This is useful during initial development, but migrations should be committed
    return;
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log("Running migrations...");
  
  try {
    await migrate(db, { migrationsFolder });
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.error("This might happen if:");
    console.error("  1. The database schema is out of sync with migrations");
    console.error("  2. Migrations were modified after being applied");
    console.error("  3. Database connection issues");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

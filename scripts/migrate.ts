/**
 * Database Migration Script
 * 
 * Runs Drizzle migrations to apply schema changes to the database
 */

import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { env } from "@/lib/env"

async function runMigrations() {
	console.log("Starting database migrations...")
	console.log(`Database URL: ${env.DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`)

	const pool = new Pool({
		connectionString: env.DATABASE_URL,
	})

	const db = drizzle(pool)

	try {
		await migrate(db, { migrationsFolder: "./lib/db/migrations" })
		console.log("✅ Migrations completed successfully!")
	} catch (error) {
		console.error("❌ Migration failed:", error)
		process.exit(1)
	} finally {
		await pool.end()
	}
}

runMigrations()

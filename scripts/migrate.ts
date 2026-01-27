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
		const migrationsFolder = "./lib/db/migrations"
		// Check if migrations folder exists and has files
		const fs = await import("fs/promises")
		try {
			const files = await fs.readdir(migrationsFolder)
			const sqlFiles = files.filter((f) => f.endsWith(".sql"))
			if (sqlFiles.length === 0) {
				console.log("⚠️  No migration files found. Using drizzle-kit push instead...")
				const { push } = await import("drizzle-orm/node-postgres/migrator")
				await push(db, { migrationsFolder })
				console.log("✅ Schema pushed successfully!")
			} else {
				await migrate(db, { migrationsFolder })
				console.log("✅ Migrations completed successfully!")
			}
		} catch (dirError) {
			console.log("⚠️  Migrations folder not found. Using drizzle-kit push instead...")
			const { push } = await import("drizzle-orm/node-postgres/migrator")
			await push(db, { migrationsFolder })
			console.log("✅ Schema pushed successfully!")
		}
	} catch (error) {
		console.error("❌ Migration failed:", error)
		process.exit(1)
	} finally {
		await pool.end()
	}
}

runMigrations()

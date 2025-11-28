import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../lib/db/schema";
import { sql } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function initDatabase() {
  console.log("Initializing database...");
  try {
    // Create app_settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        "adminPin" TEXT NOT NULL,
        "isInitialized" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create appointments table (one-time appointments)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        date DATE NOT NULL,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create recurring_appointments table (recurring appointment templates)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recurring_appointments (
        id TEXT PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        "repeatDays" TEXT[] NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS appointments_userId_date_idx ON appointments("userId", date)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS recurring_appointments_userId_idx ON recurring_appointments("userId")
    `);

    // Insert default users if none exist - REMOVED for new onboarding flow
    // const existingUsers = await db.select().from(schema.users);
    // if (existingUsers.length === 0) {
    //   await db.insert(schema.users).values([
    //     { name: "01" },
    //     { name: "02" },
    //   ]);
    //   console.log("Default users '01' and '02' created.");
    // }

    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Database initialization error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();


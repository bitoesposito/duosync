import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * GET /api/health
 * Health check endpoint for Docker and monitoring.
 * Returns 200 if the application and database are healthy.
 */
export async function GET() {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);
    
    return NextResponse.json(
      { status: "healthy", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { status: "unhealthy", error: "Database connection failed" },
      { status: 503 }
    );
  }
}


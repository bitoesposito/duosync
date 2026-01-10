/**
 * Advanced database indexes
 * These can be added manually or via raw SQL migrations
 * 
 * Note: The basic indexes are defined in schema.ts
 * This file contains advanced indexes for performance optimization
 */

import { sql } from "drizzle-orm";

/**
 * GIST index for advanced range queries on busy_intervals
 * This index enables efficient range overlap queries using PostgreSQL's range types
 * 
 * Usage: Run this SQL manually or add to a migration:
 * CREATE INDEX busy_intervals_range_gist_idx
 * ON busy_intervals USING GIST (tstzrange(start_ts, end_ts));
 */
export const createGistIndex = sql`
  CREATE INDEX IF NOT EXISTS busy_intervals_range_gist_idx
  ON busy_intervals USING GIST (tstzrange(start_ts, end_ts));
`;


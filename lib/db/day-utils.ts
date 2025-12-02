/**
 * Database utility functions for day-of-week calculations.
 * Used by server-side database services.
 */

import { DayId } from "@/types";

/**
 * Gets the day of week (1-7, Monday=1) from a date string (YYYY-MM-DD).
 * JavaScript getDay() returns 0-6 (Sunday=0), we need 1-7 (Monday=1).
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Day ID (1-7) where 1 is Monday and 7 is Sunday
 */
export function getDayOfWeek(dateStr: string): DayId {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay();
  return (day === 0 ? "7" : String(day)) as DayId;
}


/**
 * SERVER-SIDE DB - Validation-specific database operations (server-only)
 * 
 * This file contains database functions used specifically for appointment validation.
 * These functions run ONLY on the server (in API routes) and are never bundled in the client.
 * 
 * Flow: API Route → Server DB function → Database
 * 
 * IMPORTANT: This file should NEVER be imported in client components.
 * Only import this file in API routes or other server-side code.
 */

import {
  RecurringAppointmentForValidation,
  OneTimeAppointmentForValidation,
  DayId,
} from "@/types";
import { getDayOfWeek } from "@/lib/db/day-utils";

/**
 * Fetches all recurring appointments and one-time appointments for validation purposes.
 * Returns all recurring appointments (without date filtering) and all one-time appointments
 * that fall on any of the specified days.
 * Used for validating new recurring appointments to check for overlaps across all selected days.
 * 
 * @param userId - The user ID to fetch appointments for
 * @param daysToCheck - Array of day IDs (1-7) to check for one-time appointments
 * @returns Object containing all recurring appointments and relevant one-time appointments
 */
export async function getAllAppointmentsForValidation(
  userId: number,
  daysToCheck: DayId[]
): Promise<{
  recurringAppointments: RecurringAppointmentForValidation[];
  oneTimeAppointments: OneTimeAppointmentForValidation[];
}> {
  // Dynamic import to avoid bundling db code in client
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");

  try {
    // Fetch all recurring appointments for this user
    const allRecurring = await db
      .select({
        id: schema.recurringAppointments.id,
        startTime: schema.recurringAppointments.startTime,
        endTime: schema.recurringAppointments.endTime,
        repeatDays: schema.recurringAppointments.repeatDays,
      })
      .from(schema.recurringAppointments)
      .where(eq(schema.recurringAppointments.userId, userId));

    // Fetch all one-time appointments for this user
    // We need to check all appointments and filter by day of week in JavaScript
    // since we can't easily filter by day of week in SQL without date ranges
    const allOneTime = await db
      .select({
        id: schema.appointments.id,
        date: schema.appointments.date,
        startTime: schema.appointments.startTime,
        endTime: schema.appointments.endTime,
      })
      .from(schema.appointments)
      .where(eq(schema.appointments.userId, userId));

    // Filter one-time appointments by day of week
    const relevantOneTime = allOneTime
      .map((appointment) => ({
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        dayOfWeek: getDayOfWeek(appointment.date),
      }))
      .filter((appointment) => daysToCheck.includes(appointment.dayOfWeek));

    return {
      recurringAppointments: allRecurring.map((row) => ({
        id: row.id,
        startTime: row.startTime,
        endTime: row.endTime,
        repeatDays: (row.repeatDays || []) as DayId[],
      })),
      oneTimeAppointments: relevantOneTime.map((appointment) => ({
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        dayOfWeek: appointment.dayOfWeek as DayId,
      })),
    };
  } catch (error) {
    console.error("Error fetching appointments for validation:", error);
    return {
      recurringAppointments: [],
      oneTimeAppointments: [],
    };
  }
}


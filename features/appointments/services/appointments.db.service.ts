/**
 * SERVER-SIDE DB - Direct database operations (server-only)
 * 
 * This file contains functions that access the database directly.
 * These functions run ONLY on the server (in API routes) and are never bundled in the client.
 * 
 * Flow: API Route → Server DB function → Database
 * 
 * IMPORTANT: This file should NEVER be imported in client components.
 * Only import this file in API routes or other server-side code.
 */

import { Appointment } from "@/types";

/**
 * Gets the day of week (1-7, Monday=1) from a date string (YYYY-MM-DD).
 * JavaScript getDay() returns 0-6 (Sunday=0), we need 1-7 (Monday=1).
 */
function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay();
  return day === 0 ? "7" : String(day);
}

/**
 * Maps database appointment to domain Appointment type.
 */
function mapDbAppointmentToDomain(
  row: { id: string; startTime: string; endTime: string; category: string; description: string | null }
): Appointment {
  return {
    id: row.id,
    startTime: row.startTime,
    endTime: row.endTime,
    category: row.category as Appointment["category"],
    description: row.description ?? undefined,
    isRepeating: false,
    repeatDays: [],
  };
}

/**
 * Maps recurring appointment to domain Appointment type for a specific date.
 */
function mapRecurringAppointmentToDomain(
  row: {
    id: string;
    startTime: string;
    endTime: string;
    category: string;
    description: string | null;
    repeatDays: string[] | null;
  },
  date: string
): Appointment {
  return {
    id: `${row.id}-${date}`,
    startTime: row.startTime,
    endTime: row.endTime,
    category: row.category as Appointment["category"],
    description: row.description ?? undefined,
    isRepeating: true,
    repeatDays: (row.repeatDays ?? []) as Appointment["repeatDays"],
  };
}

/**
 * Fetches all appointments for a specific user and date from the database.
 * Combines one-time appointments and recurring appointments that match the day of week.
 * Used exclusively by API routes (server-side only).
 */
export async function listAppointmentsFromDb(
  userId: number,
  date?: string
): Promise<Appointment[]> {
  // Dynamic import to avoid bundling db code in client
  const { db, schema } = await import("@/lib/db");
  const { eq, and } = await import("drizzle-orm");

  try {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const dayOfWeek = getDayOfWeek(targetDate);

    // Fetch one-time appointments for this date
    const oneTimeAppointments = await db
      .select()
      .from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.userId, userId),
          eq(schema.appointments.date, targetDate)
        )
      );

    // Fetch recurring appointments that match this day of week
    const recurringAppointments = await db
      .select()
      .from(schema.recurringAppointments)
      .where(eq(schema.recurringAppointments.userId, userId));

    // Filter in JavaScript to check if dayOfWeek is in repeatDays array
    const matchingRecurring = recurringAppointments.filter((row) =>
      row.repeatDays?.includes(dayOfWeek)
    );

    // Map to domain types
    const oneTime = oneTimeAppointments.map(mapDbAppointmentToDomain);
    const recurring = matchingRecurring.map((row) =>
      mapRecurringAppointmentToDomain(row, targetDate)
    );

    return [...oneTime, ...recurring];
  } catch (error) {
    console.error("Error fetching appointments from database:", error);
    return [];
  }
}

/**
 * Fetches all recurring appointment templates for a specific user (not filtered by date).
 * Used to show all recurring appointments in the list, even if they're not active today.
 * @param userId - The user ID to fetch recurring templates for
 * @returns Promise resolving to an array of recurring appointment templates
 */
export async function getAllRecurringTemplatesFromDb(
  userId: number
): Promise<Appointment[]> {
  // Dynamic import to avoid bundling db code in client
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");

  try {
    // Fetch all recurring appointments for this user (no date filter)
    const recurringAppointments = await db
      .select()
      .from(schema.recurringAppointments)
      .where(eq(schema.recurringAppointments.userId, userId));

    // Map to domain types (use today's date for the mapping, but these are templates)
    const today = new Date().toISOString().split("T")[0];
    return recurringAppointments.map((row) => ({
      id: row.id, // Use original ID (not date-suffixed) to identify the template
      startTime: row.startTime,
      endTime: row.endTime,
      category: row.category as Appointment["category"],
      description: row.description ?? undefined,
      isRepeating: true,
      repeatDays: (row.repeatDays ?? []) as Appointment["repeatDays"],
    }));
  } catch (error) {
    console.error("Error fetching recurring templates from database:", error);
    return [];
  }
}

/**
 * Fetches appointments for multiple users in parallel.
 * Returns a map of userId -> Appointment[] for efficient lookup.
 * Used by batch API endpoint to load appointments for multiple users simultaneously.
 * @param userIds - Array of user IDs to fetch appointments for
 * @param date - Optional date in YYYY-MM-DD format (defaults to today)
 * @returns Promise resolving to a map of userId to appointments array
 */
export async function listAppointmentsBatchFromDb(
  userIds: number[],
  date?: string
): Promise<Record<number, Appointment[]>> {
  // Dynamic import to avoid bundling db code in client
  const { db, schema } = await import("@/lib/db");
  const { eq, and, inArray } = await import("drizzle-orm");

  try {
    if (userIds.length === 0) {
      return {};
    }

    const targetDate = date || new Date().toISOString().split("T")[0];
    const dayOfWeek = getDayOfWeek(targetDate);

    // Fetch one-time appointments for all users in parallel (single query)
    const oneTimeAppointments = await db
      .select()
      .from(schema.appointments)
      .where(
        and(
          inArray(schema.appointments.userId, userIds),
          eq(schema.appointments.date, targetDate)
        )
      );

    // Fetch all recurring appointments for all users (no date filter in DB)
    const recurringAppointments = await db
      .select()
      .from(schema.recurringAppointments)
      .where(inArray(schema.recurringAppointments.userId, userIds));

    // Filter in JavaScript to check if dayOfWeek is in repeatDays array
    const matchingRecurring = recurringAppointments.filter((row) =>
      row.repeatDays?.includes(dayOfWeek)
    );

    // Group appointments by userId
    const result: Record<number, Appointment[]> = {};
    
    // Initialize empty arrays for all userIds
    userIds.forEach((userId) => {
      result[userId] = [];
    });

    // Map and group one-time appointments
    oneTimeAppointments.forEach((row) => {
      const appointment = mapDbAppointmentToDomain(row);
      if (result[row.userId]) {
        result[row.userId].push(appointment);
      }
    });

    // Map and group recurring appointments
    matchingRecurring.forEach((row) => {
      const appointment = mapRecurringAppointmentToDomain(row, targetDate);
      if (result[row.userId]) {
        result[row.userId].push(appointment);
      }
    });

    return result;
  } catch (error) {
    console.error("Error fetching appointments batch from database:", error);
    // Return empty arrays for all userIds on error
    const result: Record<number, Appointment[]> = {};
    userIds.forEach((userId) => {
      result[userId] = [];
    });
    return result;
  }
}

/**
 * Fetches all appointments for a specific user.
 * Used for admin panel to show user's appointments.
 */
export async function getUserAppointmentsFromDb(userId: number): Promise<Appointment[]> {
  const { db, schema } = await import("@/lib/db");
  const { eq, desc } = await import("drizzle-orm");
  
  const oneTime = await db.select().from(schema.appointments)
    .where(eq(schema.appointments.userId, userId))
    .orderBy(desc(schema.appointments.date));
    
  const recurring = await db.select().from(schema.recurringAppointments)
    .where(eq(schema.recurringAppointments.userId, userId));
    
  const mappedOneTime = oneTime.map(mapDbAppointmentToDomain);
  
  // For recurring templates in admin list, we map them directly
  const mappedRecurring = recurring.map(row => ({
    id: row.id,
    startTime: row.startTime,
    endTime: row.endTime,
    category: row.category as Appointment["category"],
    description: row.description ?? undefined,
    isRepeating: true,
    repeatDays: (row.repeatDays ?? []) as Appointment["repeatDays"],
  }));
  
  return [...mappedOneTime, ...mappedRecurring];
}

/**
 * Creates a new appointment in the database.
 * If isRepeating is true, saves to recurring_appointments table.
 * Otherwise, saves to appointments table with the specified date (defaults to today).
 * Used exclusively by API routes (server-side only).
 */
export async function createAppointmentInDb(
  userId: number,
  appointment: Appointment,
  date?: string
): Promise<void> {
  // Dynamic import to avoid bundling db code in client
  const { db, schema } = await import("@/lib/db");

  try {
    if (appointment.isRepeating && appointment.repeatDays.length > 0) {
      // Save as recurring appointment
      await db.insert(schema.recurringAppointments).values({
        id: appointment.id,
        userId,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        category: appointment.category,
        description: appointment.description,
        repeatDays: appointment.repeatDays,
        updatedAt: new Date(),
      });
    } else {
      // Save as one-time appointment
      const targetDate = date || new Date().toISOString().split("T")[0];

      await db.insert(schema.appointments).values({
        id: appointment.id,
        userId,
        date: targetDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        category: appointment.category,
        description: appointment.description,
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error creating appointment in database:", error);
    throw error;
  }
}

/**
 * Deletes an appointment from the database.
 * Handles both one-time appointments and recurring appointments.
 * 
 * For recurring appointments:
 * - ID format is "originalId-date" (e.g., "123-2025-01-15")
 * - Instead of deleting the entire recurring template, removes only the specific day from repeatDays
 * - If only one day remains, removes that day. If no days remain, deletes the entire template.
 * 
 * For one-time appointments:
 * - Deletes the appointment directly from the appointments table.
 * 
 * Used exclusively by API routes (server-side only).
 */
export async function deleteAppointmentFromDb(
  userId: number,
  appointmentId: string
): Promise<void> {
  // Dynamic import to avoid bundling db code in client
  const { db, schema } = await import("@/lib/db");
  const { eq, and } = await import("drizzle-orm");

  try {
    // Check if it's a recurring appointment (format: "originalId-YYYY-MM-DD")
    // Recurring appointments have a date suffix in format YYYY-MM-DD
    // We check if the last 3 parts form a valid date (YYYY-MM-DD)
    const parts = appointmentId.split("-");
    const hasDateSuffix = parts.length >= 4; // Format: "id-YYYY-MM-DD" has at least 4 parts

    if (hasDateSuffix) {
      // Try to parse the last 3 parts as a date (YYYY-MM-DD)
      const potentialDate = parts.slice(-3).join("-");
      const dateMatch = potentialDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      
      if (dateMatch) {
        // Valid date format found - this is a recurring appointment instance
        const recurringId = parts.slice(0, -3).join("-");
        const dateStr = potentialDate;
        const dayOfWeek = getDayOfWeek(dateStr);

      // Fetch the current recurring appointment to get its repeatDays
      const recurringAppointment = await db
        .select()
        .from(schema.recurringAppointments)
        .where(
          and(
            eq(schema.recurringAppointments.id, recurringId),
            eq(schema.recurringAppointments.userId, userId)
          )
        )
        .limit(1);

      if (recurringAppointment.length === 0) {
        // Appointment not found, nothing to delete
        return;
      }

      const currentRepeatDays = recurringAppointment[0].repeatDays || [];
      
      // Remove the specific day from repeatDays
      const updatedRepeatDays = currentRepeatDays.filter((day) => day !== dayOfWeek);

        if (updatedRepeatDays.length === 0) {
          // No days left, delete the entire recurring appointment template
          await db
            .delete(schema.recurringAppointments)
            .where(
              and(
                eq(schema.recurringAppointments.id, recurringId),
                eq(schema.recurringAppointments.userId, userId)
              )
            );
        } else {
          // Update the recurring appointment to remove the specific day
          await db
            .update(schema.recurringAppointments)
            .set({
              repeatDays: updatedRepeatDays,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(schema.recurringAppointments.id, recurringId),
                eq(schema.recurringAppointments.userId, userId)
              )
            );
        }
      } else {
        // Date format not valid, treat as one-time appointment
        await db
          .delete(schema.appointments)
          .where(
            and(
              eq(schema.appointments.id, appointmentId),
              eq(schema.appointments.userId, userId)
            )
          );
      }
    } else {
      // One-time appointment - delete directly
      await db
        .delete(schema.appointments)
        .where(
          and(
            eq(schema.appointments.id, appointmentId),
            eq(schema.appointments.userId, userId)
          )
        );
    }
  } catch (error) {
    console.error("Error deleting appointment from database:", error);
    throw error;
  }
}

/**
 * Updates an appointment in the database.
 * Handles both one-time appointments and recurring appointments.
 * 
 * For recurring appointments:
 * - Updates the recurring appointment template
 * - Note: This updates all instances of the recurring appointment
 * 
 * For one-time appointments:
 * - Updates the appointment directly in the appointments table.
 * 
 * Used exclusively by API routes (server-side only).
 */
export async function updateAppointmentInDb(
  userId: number,
  appointmentId: string,
  updatedAppointment: Appointment
): Promise<void> {
  // Dynamic import to avoid bundling db code in client
  const { db, schema } = await import("@/lib/db");
  const { eq, and } = await import("drizzle-orm");

  try {
    // Check if it's a recurring appointment (format: "originalId-YYYY-MM-DD")
    const parts = appointmentId.split("-");
    const hasDateSuffix = parts.length >= 4;

    if (hasDateSuffix) {
      // Try to parse the last 3 parts as a date (YYYY-MM-DD)
      const potentialDate = parts.slice(-3).join("-");
      const dateMatch = potentialDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      
      if (dateMatch) {
        // This is a recurring appointment instance
        // We update the recurring template, not the instance
        const recurringId = parts.slice(0, -3).join("-");
        
        await db
          .update(schema.recurringAppointments)
          .set({
            startTime: updatedAppointment.startTime,
            endTime: updatedAppointment.endTime,
            category: updatedAppointment.category,
            description: updatedAppointment.description,
            repeatDays: updatedAppointment.repeatDays,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.recurringAppointments.id, recurringId),
              eq(schema.recurringAppointments.userId, userId)
            )
          );
        return;
      }
    }

    // One-time appointment - update directly
    await db
      .update(schema.appointments)
      .set({
        startTime: updatedAppointment.startTime,
        endTime: updatedAppointment.endTime,
        category: updatedAppointment.category,
        description: updatedAppointment.description,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.appointments.id, appointmentId),
          eq(schema.appointments.userId, userId)
        )
      );
  } catch (error) {
    console.error("Error updating appointment in database:", error);
    throw error;
  }
}


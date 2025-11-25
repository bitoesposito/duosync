import { db, schema } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { Appointment, DayId } from "@/types";

/**
 * Gets the day of week (1-7, Monday=1) from a date string (YYYY-MM-DD).
 * JavaScript getDay() returns 0-6 (Sunday=0), we need 1-7 (Monday=1).
 */
function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00"); // Ensure local time
  const day = date.getDay();
  // Convert: 0=Sunday -> 7, 1=Monday -> 1, ..., 6=Saturday -> 6
  return day === 0 ? "7" : String(day);
}

/**
 * Maps database appointment to domain Appointment type.
 */
function mapDbAppointmentToDomain(row: typeof schema.appointments.$inferSelect): Appointment {
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
  row: typeof schema.recurringAppointments.$inferSelect,
  date: string
): Appointment {
  return {
    id: `${row.id}-${date}`, // Unique ID for this occurrence
    startTime: row.startTime,
    endTime: row.endTime,
    category: row.category as Appointment["category"],
    description: row.description ?? undefined,
    isRepeating: true,
    repeatDays: (row.repeatDays ?? []) as Appointment["repeatDays"],
  };
}

/**
 * Fetches all appointments for a specific user and date.
 * Combines one-time appointments and recurring appointments that match the day of week.
 * If date is not provided, uses today's date.
 */
export async function listAppointmentsFromDb(
  userId: number,
  date?: string
): Promise<Appointment[]> {
  try {
    const targetDate = date || new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const dayOfWeek = getDayOfWeek(targetDate);

    // Fetch one-time appointments for this date
    const oneTimeAppointments = await db
      .select()
      .from(schema.appointments)
      .where(and(eq(schema.appointments.userId, userId), eq(schema.appointments.date, targetDate)));

    // Fetch recurring appointments that match this day of week
    // Check if dayOfWeek is in the repeatDays array
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
 * Creates a new appointment in the database.
 * If isRepeating is true, saves to recurring_appointments table.
 * Otherwise, saves to appointments table with the specified date (defaults to today).
 */
export async function createAppointmentInDb(
  userId: number,
  appointment: Appointment,
  date?: string
): Promise<void> {
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
      const targetDate = date || new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

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
 * For recurring appointments, the ID format is "originalId-date", so we extract the original ID.
 */
export async function deleteAppointmentFromDb(
  userId: number,
  appointmentId: string
): Promise<void> {
  try {
    // Check if it's a recurring appointment (format: "originalId-date")
    const isRecurring = appointmentId.includes("-");
    
    if (isRecurring) {
      // Extract the original recurring appointment ID
      const recurringId = appointmentId.split("-").slice(0, -1).join("-");
      
      // Delete from recurring_appointments table
      await db
        .delete(schema.recurringAppointments)
        .where(
          and(
            eq(schema.recurringAppointments.id, recurringId),
            eq(schema.recurringAppointments.userId, userId)
          )
        );
    } else {
      // Delete from one-time appointments table
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


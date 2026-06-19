/**
 * Appointments API — the entire surface in one file.
 *   GET    /api/appointments?date=YYYY-MM-DD  → all users' appointments for the date
 *                                               (one-time + expanded recurring)
 *   POST   /api/appointments                  → upsert one-time or recurring
 *   DELETE /api/appointments?id&isRepeating   → delete one-time appt or recurring template
 *
 * Server-side validation reuses the same pure helpers the SPA uses.
 */

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { appointments, recurringAppointments } from "../../db/schema";
import { dayOfWeek } from "../../shared/recurrence";
import { normalizeEndTime } from "../../shared/time";
import { validateOneTime, validateRecurring } from "../../shared/validation";
import type { AppointmentInput, DayAppointment } from "../../shared/types";

interface Env {
  DB: D1Database;
}

interface UpsertBody {
  userId: number;
  date?: string;
  appointment: AppointmentInput & { id?: string };
}

const todayISO = (): string => new Date().toISOString().slice(0, 10);
const json = (data: unknown, status = 200): Response => Response.json(data, { status });

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const date = new URL(request.url).searchParams.get("date") ?? todayISO();
  const db = drizzle(env.DB);

  const [oneTime, templates] = await Promise.all([
    db.select().from(appointments).where(eq(appointments.date, date)),
    db.select().from(recurringAppointments),
  ]);

  const byUser: Record<number, DayAppointment[]> = {};
  const push = (uid: number, a: DayAppointment) => {
    (byUser[uid] ??= []).push(a);
  };

  for (const a of oneTime) {
    push(a.userId, {
      id: a.id,
      startTime: a.startTime,
      endTime: a.endTime,
      category: a.category,
      description: a.description ?? undefined,
      isRepeating: false,
      repeatDays: [],
    });
  }

  const dow = dayOfWeek(date);
  for (const t of templates) {
    if (!t.repeatDays.includes(dow)) continue;
    push(t.userId, {
      id: `${t.id}-${date}`,
      templateId: t.id,
      startTime: t.startTime,
      endTime: t.endTime,
      category: t.category,
      description: t.description ?? undefined,
      isRepeating: true,
      repeatDays: t.repeatDays,
    });
  }

  return json(byUser);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let body: UpsertBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad-json" }, 400);
  }
  const { userId, appointment } = body;
  if (typeof userId !== "number" || !appointment) return json({ error: "bad-request" }, 400);

  const db = drizzle(env.DB);
  const endTime = normalizeEndTime(appointment.startTime, appointment.endTime);
  const base = {
    startTime: appointment.startTime,
    endTime,
    category: appointment.category,
    description: appointment.description?.trim() || null,
  };

  if (appointment.isRepeating) {
    const [templates, userOneTime] = await Promise.all([
      db.select().from(recurringAppointments).where(eq(recurringAppointments.userId, userId)),
      db.select().from(appointments).where(eq(appointments.userId, userId)),
    ]);
    const result = validateRecurring(
      appointment,
      templates.map((t) => ({ id: t.id, startTime: t.startTime, endTime: t.endTime, repeatDays: t.repeatDays })),
      userOneTime.map((a) => ({ id: a.id, startTime: a.startTime, endTime: a.endTime, dayOfWeek: dayOfWeek(a.date) })),
      appointment.id,
    );
    if (!result.ok) return json({ error: result.reason }, 400);

    const id = appointment.id ?? crypto.randomUUID();
    await db
      .insert(recurringAppointments)
      .values({ id, userId, ...base, repeatDays: appointment.repeatDays })
      .onConflictDoUpdate({
        target: recurringAppointments.id,
        set: { ...base, repeatDays: appointment.repeatDays },
      });
    return json({ id, isRepeating: true }, appointment.id ? 200 : 201);
  }

  const date = body.date ?? todayISO();
  const existing = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.userId, userId), eq(appointments.date, date)));
  const result = validateOneTime(
    appointment,
    existing.map((a) => ({
      id: a.id,
      startTime: a.startTime,
      endTime: a.endTime,
      category: a.category,
      description: a.description ?? undefined,
      isRepeating: false,
      repeatDays: [],
    })),
    appointment.id,
  );
  if (!result.ok) return json({ error: result.reason }, 400);

  const id = appointment.id ?? crypto.randomUUID();
  await db
    .insert(appointments)
    .values({ id, userId, date, ...base })
    .onConflictDoUpdate({ target: appointments.id, set: { date, ...base } });
  return json({ id, isRepeating: false }, appointment.id ? 200 : 201);
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, request }) => {
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  if (!id) return json({ error: "missing-id" }, 400);

  const db = drizzle(env.DB);
  if (params.get("isRepeating") === "true") {
    await db.delete(recurringAppointments).where(eq(recurringAppointments.id, id));
  } else {
    await db.delete(appointments).where(eq(appointments.id, id));
  }
  return new Response(null, { status: 204 });
};

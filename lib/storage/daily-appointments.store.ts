import { promises as fs } from "node:fs";
import path from "node:path";
import { Appointment } from "@/types";

type DailyAppointmentBucket = {
  updatedAt: string;
  appointments: Appointment[];
};

type DailyAppointmentStore = Record<number, DailyAppointmentBucket>;

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "daily-appointments.json");

const todayStamp = () => new Date().toISOString().slice(0, 10);

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2), "utf8");
  }
}

async function readStore(): Promise<DailyAppointmentStore> {
  await ensureDataFile();

  const raw = await fs.readFile(DATA_FILE, "utf8");
  if (!raw.trim()) return {};

  try {
    return JSON.parse(raw) as DailyAppointmentStore;
  } catch {
    return {};
  }
}

async function writeStore(store: DailyAppointmentStore) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

function refreshStoreDates(store: DailyAppointmentStore): DailyAppointmentStore {
  const today = todayStamp();

  for (const id of Object.keys(store)) {
    const numericId = Number(id);
    const bucket = store[numericId];
    if (!bucket || bucket.updatedAt !== today) {
      store[numericId] = { updatedAt: today, appointments: [] };
    }
  }

  return store;
}

function ensureBucket(
  store: DailyAppointmentStore,
  userId: number
): DailyAppointmentBucket {
  const bucket = store[userId];
  if (bucket) {
    return bucket;
  }
  const freshBucket: DailyAppointmentBucket = {
    updatedAt: todayStamp(),
    appointments: [],
  };
  store[userId] = freshBucket;
  return freshBucket;
}

async function readStoreWithRefresh() {
  const store = await readStore();
  return refreshStoreDates(store);
}

export async function loadDailyAppointments(
  userId: number | undefined
): Promise<Appointment[]> {
  if (typeof userId === "undefined") return [];
  const store = await readStoreWithRefresh();
  return store[userId]?.appointments ?? [];
}

export async function addDailyAppointment(
  userId: number,
  appointment: Appointment
) {
  const store = await readStoreWithRefresh();
  const bucket = ensureBucket(store, userId);
  bucket.appointments = [...bucket.appointments, appointment];
  bucket.updatedAt = todayStamp();
  await writeStore(store);
  return bucket.appointments;
}

export async function removeDailyAppointment(
  userId: number,
  appointmentId: string
) {
  const store = await readStoreWithRefresh();
  const bucket = ensureBucket(store, userId);
  bucket.appointments = bucket.appointments.filter(
    (appointment) => appointment.id !== appointmentId
  );
  bucket.updatedAt = todayStamp();
  await writeStore(store);
  return bucket.appointments;
}



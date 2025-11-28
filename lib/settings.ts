import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * App settings service - handles application-wide configuration.
 * Manages admin PIN and initialization state.
 */

/**
 * Fetches the application settings from the database.
 * Settings are stored as a single row with id=1.
 * @returns The app settings object or undefined if not found
 */
export async function getAppSettings() {
  const settings = await db.select().from(schema.appSettings).where(eq(schema.appSettings.id, 1));
  return settings[0];
}

/**
 * Checks if the application has been initialized.
 * An app is considered initialized if app_settings exists and isInitialized is true.
 * @returns true if initialized, false otherwise
 */
export async function isAppInitialized() {
  const settings = await getAppSettings();
  return settings?.isInitialized ?? false;
}


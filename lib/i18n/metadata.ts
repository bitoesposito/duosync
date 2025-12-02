/**
 * Server-side i18n utilities for generating metadata.
 * These functions work on the server and can read cookies/headers to detect locale.
 */

import { cookies, headers } from "next/headers";
import type { Locale } from "@/types";
import it from "@/i18n/it.json";
import en from "@/i18n/en.json";

const SUPPORTED_LOCALES: Locale[] = ["it", "en"];
const DEFAULT_LOCALE: Locale = "it";

const messages = {
  it,
  en,
} as const;

/**
 * Detects the preferred locale from cookies or Accept-Language header.
 * Used server-side in generateMetadata functions.
 * @returns The detected locale
 */
export async function detectServerLocale(): Promise<Locale> {
  try {
    // Try to read locale from cookie (set by client-side I18nProvider)
    // In Next.js 16, cookies() returns a Promise and must be awaited
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("duosync.locale");
    
    if (localeCookie?.value && SUPPORTED_LOCALES.includes(localeCookie.value as Locale)) {
      return localeCookie.value as Locale;
    }

    // Fall back to Accept-Language header
    // In Next.js 16, headers() returns a Promise and must be awaited
    const headersList = await headers();
    const acceptLanguage = headersList.get("accept-language");
    
    if (acceptLanguage) {
      // Parse Accept-Language header (e.g., "en-US,en;q=0.9,it;q=0.8")
      const languages = acceptLanguage
        .split(",")
        .map((lang) => lang.split(";")[0].trim().toLowerCase().split("-")[0]);
      
      for (const lang of languages) {
        if (SUPPORTED_LOCALES.includes(lang as Locale)) {
          return lang as Locale;
        }
      }
    }
  } catch (error) {
    // If cookies() or headers() fail (e.g., in static generation), fall back to default
    console.warn("Failed to detect locale server-side:", error);
  }

  return DEFAULT_LOCALE;
}

/**
 * Gets metadata translations for a given locale.
 * @param locale - The locale to use
 * @returns Metadata translations object
 */
export function getMetadataTranslations(locale: Locale) {
  const localeMessages = messages[locale] || messages[DEFAULT_LOCALE];
  return localeMessages.metadata || messages[DEFAULT_LOCALE].metadata;
}

/**
 * Gets the Open Graph locale code for a given locale.
 * @param locale - The locale to use
 * @returns Open Graph locale code (e.g., "it_IT", "en_US")
 */
export function getOpenGraphLocale(locale: Locale): string {
  const localeMap: Record<Locale, string> = {
    it: "it_IT",
    en: "en_US",
  };
  return localeMap[locale] || localeMap[DEFAULT_LOCALE];
}


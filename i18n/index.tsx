"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Locale,
  TranslationValues,
  I18nContextValue,
} from "@/types";
import it from "./it.json";
import en from "./en.json";

/**
 * Messages map for all supported locales.
 */
const messages = {
  it,
  en,
} as const;

/**
 * Array of supported locale codes.
 */
export const SUPPORTED_LOCALES = Object.keys(messages) as Locale[];

const DEFAULT_LOCALE: Locale = "it";
const STORAGE_KEY = "duosync.locale";
const COOKIE_KEY = "duosync.locale";

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/**
 * Resolves a translation key to its message string.
 * Supports nested keys using dot notation (e.g., "header.appName").
 * @param locale - The locale to use for translation
 * @param key - The translation key (supports dot notation)
 * @returns The translated string or the key itself if not found
 */
function resolveMessage(locale: Locale, key: string): string {
  const segments = key.split(".");
  let current: unknown = messages[locale];

  for (const segment of segments) {
    if (current && typeof current === "object" && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return key; // Return key if path is invalid
    }
  }

  return typeof current === "string" ? current : key;
}

/**
 * Applies template interpolation to a translation string.
 * Replaces {{key}} placeholders with values from the values object.
 * @param template - The template string with {{placeholders}}
 * @param values - Optional object with values for interpolation
 * @returns The interpolated string
 */
function applyTemplate(template: string, values?: TranslationValues): string {
  if (!values || Object.keys(values).length === 0) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

/**
 * Reads a cookie value by name.
 * @param name - The cookie name
 * @returns The cookie value or null if not found
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

/**
 * Sets a cookie value.
 * @param name - The cookie name
 * @param value - The cookie value
 * @param days - Number of days until expiration (default: 365)
 */
function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
}

/**
 * Detects the user's preferred locale from cookies, localStorage, or browser settings.
 * On initial render, prioritizes initialLocale (from server) to prevent hydration mismatch.
 * On subsequent renders, checks cookie -> localStorage -> browser language -> default.
 * @param initialLocale - Optional initial locale from server-side detection (used on first render only)
 * @returns The detected locale
 */
function detectLocale(initialLocale?: Locale): Locale {
  if (typeof window === "undefined") {
    return initialLocale || DEFAULT_LOCALE;
  }

  // On first render, prioritize initialLocale from server to match SSR
  // This prevents hydration mismatch
  if (initialLocale && SUPPORTED_LOCALES.includes(initialLocale)) {
    return initialLocale;
  }

  // Check cookie (for SSR sync on subsequent renders)
  const cookieLocale = getCookie(COOKIE_KEY) as Locale | null;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }

  // Check localStorage
  const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && SUPPORTED_LOCALES.includes(stored)) {
    return stored;
  }

  // Fall back to browser language
  const browserLang = window.navigator.language.split("-")[0] as Locale;
  if (SUPPORTED_LOCALES.includes(browserLang)) {
    return browserLang;
  }

  return DEFAULT_LOCALE;
}

/**
 * Provider component that manages i18n state and translations.
 * Handles locale detection, persistence, and translation resolution.
 * @param children - React children to render
 * @param initialLocale - Optional initial locale from server-side detection (prevents hydration mismatch)
 */
export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  // Use initialLocale on first render to match server-side rendering
  // This prevents hydration mismatch by ensuring client initial state matches server
  const [locale, setLocale] = useState<Locale>(() => detectLocale(initialLocale));

  // Persist locale changes to both localStorage and cookies, and update HTML lang attribute
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, locale);
    setCookie(COOKIE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  // Memoized translation function with locale dependency
  const translate = useCallback(
    (key: string, values?: TranslationValues): string => {
      const template = resolveMessage(locale, key);
      return applyTemplate(template, values);
    },
    [locale]
  );

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: translate,
    }),
    [locale, translate]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access the i18n context.
 * This is the public API for i18n functionality.
 */
export function useI18nContext() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18nContext must be used within <I18nProvider>");
  }
  return ctx;
}

/**
 * Alias for useI18nContext for consistency with other hooks.
 */
export const useI18n = useI18nContext;
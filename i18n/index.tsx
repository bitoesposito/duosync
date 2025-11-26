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
import uk from "./uk.json";

/**
 * Messages map for all supported locales.
 */
const messages = {
  it,
  en,
  uk,
} as const;

/**
 * Array of supported locale codes.
 */
export const SUPPORTED_LOCALES = Object.keys(messages) as Locale[];

const DEFAULT_LOCALE: Locale = "it";
const STORAGE_KEY = "duosync.locale";

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
 * Detects the user's preferred locale from localStorage or browser settings.
 * Falls back to the default locale if no valid preference is found.
 * @returns The detected locale
 */
function detectLocale(): Locale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  // Check localStorage first
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
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => detectLocale());

  // Persist locale changes to localStorage and update HTML lang attribute
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, locale);
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
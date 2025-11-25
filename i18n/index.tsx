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
import it from "./it.json";
import en from "./en.json";

const messages = {
  it,
  en,
} as const;

type Messages = typeof messages;
export type Locale = keyof Messages;
export const SUPPORTED_LOCALES = Object.keys(messages) as Locale[];

type TranslationValues = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, values?: TranslationValues) => string;
};

const DEFAULT_LOCALE: Locale = "it";
const STORAGE_KEY = "duosync.locale";

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function resolveMessage(locale: Locale, key: string) {
  const segments = key.split(".");
  let current: unknown = messages[locale];

  for (const segment of segments) {
    if (typeof current === "object" && current !== null) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      current = undefined;
      break;
    }
  }

  return typeof current === "string" ? current : key;
}

function applyTemplate(template: string, values?: TranslationValues) {
  if (!values) return template;
  return template.replace(/{{(.*?)}}/g, (_match, token) => {
    const key = token.trim();
    const replacement = values[key];
    return typeof replacement === "undefined" ? `{{${key}}}` : String(replacement);
  });
}

function detectLocale(): Locale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && SUPPORTED_LOCALES.includes(stored)) {
    return stored;
  }

  const navigatorLocale = window.navigator.language.split("-")[0] as Locale;
  if (navigatorLocale && SUPPORTED_LOCALES.includes(navigatorLocale)) {
    return navigatorLocale;
  }

  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => detectLocale());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const translate = useCallback(
    (key: string, values?: TranslationValues) => {
      const template = resolveMessage(locale, key);
      return applyTemplate(template, values);
    },
    [locale]
  );

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

export function useI18nContext() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n deve essere usato all'interno di <I18nProvider>");
  }
  return ctx;
}
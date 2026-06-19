import { useUiStore } from "@/store/ui";
import en from "./en.json";
import it from "./it.json";

export type Locale = "en" | "it";
type Values = Record<string, string | number>;

const dictionaries: Record<Locale, unknown> = { en, it };

function translate(locale: Locale, key: string, values?: Values): string {
  let current: unknown = dictionaries[locale];
  for (const part of key.split(".")) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      current = undefined;
      break;
    }
  }
  let result = typeof current === "string" ? current : key;
  if (values) {
    for (const [name, value] of Object.entries(values)) {
      result = result.replaceAll(`{{${name}}}`, String(value));
    }
  }
  return result;
}

export function useI18n() {
  const locale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);
  const t = (key: string, values?: Values) => translate(locale, key, values);
  return { locale, setLocale, t };
}

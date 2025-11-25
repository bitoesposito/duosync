import { useI18nContext } from "@/i18n";

/**
 * Public hook that exposes translation helpers and the active locale.
 */
export function useI18n() {
  return useI18nContext();
}
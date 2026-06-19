import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/i18n/useI18n";

interface UiState {
  activeUserId: number | null;
  locale: Locale;
  setActiveUserId: (id: number) => void;
  setLocale: (locale: Locale) => void;
}

/** Active user + locale, persisted to localStorage. Theme lives in ThemeProvider. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeUserId: null,
      locale: "en",
      setActiveUserId: (id) => set({ activeUserId: id }),
      setLocale: (locale) => set({ locale }),
    }),
    { name: "duosync-ui" },
  ),
);

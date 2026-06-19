import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/i18n/useI18n";
import type { Locale } from "@/i18n/useI18n";
import { useUiStore } from "@/store/ui";
import type { UserProfile } from "@shared";

const selectClass = "h-8 rounded-md border border-border bg-background px-2 text-xs";

export function Header({ users }: { users: UserProfile[] }) {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const activeUserId = useUiStore((s) => s.activeUserId);
  const setActiveUserId = useUiStore((s) => s.setActiveUserId);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <div className="font-heading text-lg font-semibold">{t("common.appName")}</div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label={t("header.user")}
          className={selectClass}
          value={activeUserId ?? ""}
          onChange={(e) => setActiveUserId(Number(e.target.value))}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t("header.language")}
          className={selectClass}
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          <option value="en">EN</option>
          <option value="it">IT</option>
        </select>
        <select
          aria-label={t("header.theme")}
          className={selectClass}
          value={theme}
          onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
        >
          <option value="light">{t("header.themeLight")}</option>
          <option value="dark">{t("header.themeDark")}</option>
          <option value="system">{t("header.themeSystem")}</option>
        </select>
      </div>
    </header>
  );
}

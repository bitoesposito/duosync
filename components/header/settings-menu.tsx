"use client";

import {
  SettingsIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useI18n, SUPPORTED_LOCALES } from "@/i18n";
import { type Locale } from "@/types";

/**
 * Settings menu component for the header.
 * Contains theme and language options.
 */
export default function SettingsMenu() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer rounded-none h-10 w-10 hover:bg-transparent hover:text-muted-foreground"
          aria-label={t("header.settings")}
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[16rem]">
        {/* Theme Section - Most frequently used */}
        <div className="px-2 py-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
            {t("header.theme")}
          </Label>
          <div className="flex items-center justify-between gap-4">
            <div
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <MoonIcon className="h-4 w-4 shrink-0" />
              ) : (
                <SunIcon className="h-4 w-4 shrink-0" />
              )}
              <Label className="text-sm font-medium cursor-pointer">
                {theme === "dark"
                  ? t("header.themeDark")
                  : t("header.themeLight")}
              </Label>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => {
                setTheme(checked ? "dark" : "light");
              }}
              className="cursor-pointer rounded-full data-[state=checked]:bg-foreground shrink-0"
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Language Section */}
        <div className="px-2 py-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
            {t("header.language")}
          </Label>
          <ToggleGroup
            type="single"
            value={locale}
            onValueChange={(value) => {
              if (value) setLocale(value as Locale);
            }}
            className="w-full justify-between gap-px bg-border border border-border"
          >
            {SUPPORTED_LOCALES.map((code) => (
              <ToggleGroupItem
                key={code}
                value={code}
                className="text-xs font-medium flex-1 h-8 rounded-none bg-background data-[state=on]:bg-foreground data-[state=on]:text-background hover:bg-muted transition-colors cursor-pointer"
              >
                {code.toUpperCase()}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}

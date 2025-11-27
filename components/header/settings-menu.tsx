"use client";

import { useState } from "react";
import {
  SettingsIcon,
  DownloadIcon,
  BellIcon,
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
import { usePWAInstall } from "@/hooks";
import { useNotifications } from "@/hooks";
import { useI18n, SUPPORTED_LOCALES } from "@/i18n";
import { type Locale } from "@/types";

/**
 * Settings menu component for the header.
 * Contains PWA settings, theme, and language options.
 */
export default function SettingsMenu() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const {
    isSupported: notificationsSupported,
    permission,
    requestPermission,
    isReady,
  } = useNotifications();

  const [isInstalling, setIsInstalling] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  /**
   * Handles the install button click.
   */
  const handleInstall = async () => {
    setIsInstalling(true);
    await promptInstall();
    setIsInstalling(false);
  };

  /**
   * Handles notification enable button click.
   */
  const handleEnableNotifications = async () => {
    if (permission === "granted") {
      return;
    }

    setIsRequestingPermission(true);
    await requestPermission();
    setIsRequestingPermission(false);
  };

  const notificationsEnabled = permission === "granted";
  const notificationsDisabled = permission === "denied";
  const canEnableNotifications =
    notificationsSupported && permission === "default" && isReady;

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

        <div className="flex flex-col gap-3 p-2">
          {/* Special Action Buttons - One-time actions at the bottom */}
          {(!isInstalled || (!notificationsEnabled && canEnableNotifications)) && (
            <DropdownMenuSeparator />
          )}

           {!isInstalled && (
             <Button
               onClick={handleInstall}
               disabled={!isInstallable || isInstalling}
               className="w-full rounded-none font-medium disabled:opacity-50 cursor-pointer"
               size="sm"
               variant={!isInstallable ? "outline" : "default"}
             >
               <DownloadIcon className="h-4 w-4 mr-2" />
               {isInstalling
                 ? t("settings.pwa.install.installing")
                 : t("settings.pwa.install.install")}
             </Button>
           )}

          {!notificationsEnabled && canEnableNotifications && (
            <Button
              onClick={handleEnableNotifications}
              disabled={isRequestingPermission}
              className="w-full rounded-none font-medium bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              size="sm"
            >
              <BellIcon className="h-4 w-4 mr-2" />
              {t("settings.pwa.notifications.title")}
            </Button>
          )}

        </div>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}


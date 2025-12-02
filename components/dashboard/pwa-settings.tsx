"use client";

import { useState } from "react";
import { DownloadIcon, CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { usePWAInstall } from "@/hooks";
import { useNotifications } from "@/hooks";
import { useI18n } from "@/i18n";

/**
 * PWA Settings section component.
 * Allows users to manage app installation and notification preferences.
 */
export default function PWASettings() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const {
    isSupported: notificationsSupported,
    permission,
    requestPermission,
    isReady,
  } = useNotifications();
  const { t } = useI18n();

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
   * Handles notification toggle.
   */
  const handleNotificationToggle = async (enabled: boolean) => {
    if (!enabled) {
      // Cannot disable notifications programmatically, only inform user
      return;
    }

    if (permission === "granted") {
      return; // Already enabled
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
    <section className="w-full flex flex-col gap-4 border border-border bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <h2 className="text-lg font-medium tracking-tight">
          {t("settings.pwa.title")}
        </h2>
      </header>

      <div className="flex flex-col gap-4 px-4 pb-4">
        {/* App Installation Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">
                {t("settings.pwa.install.title")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {isInstalled
                  ? t("settings.pwa.install.installed")
                  : isInstallable
                  ? t("settings.pwa.install.available")
                  : t("settings.pwa.install.notAvailable")}
              </p>
            </div>
            {isInstalled ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckIcon className="w-4 h-4" />
                <span>{t("settings.pwa.install.installedLabel")}</span>
              </div>
            ) : (
              <Button
                onClick={handleInstall}
                disabled={!isInstallable || isInstalling}
                size="sm"
                className="rounded-none font-medium cursor-pointer"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                {isInstalling
                  ? t("settings.pwa.install.installing")
                  : t("settings.pwa.install.install")}
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Notifications Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">
                {t("settings.pwa.notifications.title")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {notificationsEnabled
                  ? t("settings.pwa.notifications.enabled")
                  : notificationsDisabled
                  ? t("settings.pwa.notifications.disabled")
                  : canEnableNotifications
                  ? t("settings.pwa.notifications.available")
                  : t("settings.pwa.notifications.notSupported")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {notificationsEnabled && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t("settings.pwa.notifications.enabledLabel")}
                  </span>
                </div>
              )}
              {notificationsDisabled && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <XIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t("settings.pwa.notifications.disabledLabel")}
                  </span>
                </div>
              )}
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
                disabled={
                  !canEnableNotifications ||
                  notificationsDisabled ||
                  isRequestingPermission
                }
                className="cursor-pointer rounded-full data-[state=checked]:bg-foreground"
              />
            </div>
          </div>
          {notificationsDisabled && (
            <p className="text-xs text-muted-foreground italic">
              {t("settings.pwa.notifications.disabledHint")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}


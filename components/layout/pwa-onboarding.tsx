"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, BellIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useNotifications } from "@/hooks";
import { useI18n } from "@/i18n";

const STORAGE_KEYS = {
  INSTALL_PROMPT_DISMISSED: "duosync.installPromptDismissed",
  NOTIFICATION_PROMPT_DISMISSED: "duosync.notificationPromptDismissed",
} as const;

/**
 * Main component that handles PWA onboarding prompts.
 * Shows install prompt and notification permission prompt when appropriate.
 */
export default function PWAOnboarding() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const { isSupported, permission, requestPermission, isReady } =
    useNotifications();
  const { t } = useI18n();

  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Check if prompts should be shown on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Check if install prompt was already dismissed
    const installDismissed = localStorage.getItem(
      STORAGE_KEYS.INSTALL_PROMPT_DISMISSED
    );
    // Check if notification prompt was already dismissed
    const notificationDismissed = localStorage.getItem(
      STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED
    );

    // Show install prompt if:
    // - App is installable
    // - Not already installed
    // - Not already dismissed
    // - Wait a bit for the page to load
    if (
      isInstallable &&
      !isInstalled &&
      !installDismissed &&
      !showInstallPrompt
    ) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 2000); // Show after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, showInstallPrompt]);

  // Show notification prompt after install prompt is handled
  useEffect(() => {
    if (
      !showInstallPrompt &&
      isSupported &&
      permission === "default" &&
      isReady
    ) {
      const notificationDismissed = localStorage.getItem(
        STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED
      );

      if (!notificationDismissed && !showNotificationPrompt) {
        const timer = setTimeout(() => {
          setShowNotificationPrompt(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    showInstallPrompt,
    isSupported,
    permission,
    isReady,
    showNotificationPrompt,
  ]);

  /**
   * Handles install button click.
   */
  const handleInstall = async () => {
    setIsInstalling(true);
    const accepted = await promptInstall();
    setIsInstalling(false);

    if (accepted) {
      setShowInstallPrompt(false);
      // Don't mark as dismissed if user accepted
    } else {
      // User dismissed, remember it
      localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, "true");
      setShowInstallPrompt(false);
    }
  };

  /**
   * Handles install prompt dismissal.
   */
  const handleDismissInstall = () => {
    localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, "true");
    setShowInstallPrompt(false);
  };

  /**
   * Handles notification permission request.
   */
  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowNotificationPrompt(false);
      // Don't mark as dismissed if user accepted
    } else {
      // User denied, remember it
      localStorage.setItem(
        STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED,
        "true"
      );
      setShowNotificationPrompt(false);
    }
  };

  /**
   * Handles notification prompt dismissal.
   */
  const handleDismissNotifications = () => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED, "true");
    setShowNotificationPrompt(false);
  };

  return (
    <>
      {/* Install Prompt */}
      <Dialog
        open={showInstallPrompt}
        onOpenChange={(open: boolean) => {
          if (!open) {
            handleDismissInstall();
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <DownloadIcon className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle>{t("onboarding.install.title")}</DialogTitle>
            </div>
            <DialogDescription>
              {t("onboarding.install.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleDismissInstall}
              disabled={isInstalling}
            >
              {t("onboarding.install.dismiss")}
            </Button>
            <Button onClick={handleInstall} disabled={isInstalling}>
              {isInstalling
                ? t("onboarding.install.installing")
                : t("onboarding.install.install")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Prompt */}
      <Dialog
        open={showNotificationPrompt}
        onOpenChange={(open: boolean) => {
          if (!open) {
            handleDismissNotifications();
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BellIcon className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle>{t("onboarding.notifications.title")}</DialogTitle>
            </div>
            <DialogDescription>
              {t("onboarding.notifications.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleDismissNotifications}
            >
              {t("onboarding.notifications.dismiss")}
            </Button>
            <Button onClick={handleEnableNotifications}>
              {t("onboarding.notifications.enable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


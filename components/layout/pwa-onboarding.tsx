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
import { usePWAPrompt } from "@/features/pwa/pwa-prompt-context";

const STORAGE_KEYS = {
  INSTALL_PROMPT_DISMISSED: "duosync.installPromptDismissed",
  NOTIFICATION_PROMPT_DISMISSED: "duosync.notificationPromptDismissed",
} as const;

/**
 * Main component that handles PWA onboarding prompts.
 * Shows install prompt and notification permission prompt when triggered programmatically.
 */
export default function PWAOnboarding() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const { isSupported, permission, requestPermission, isReady } =
    useNotifications();
  const { t } = useI18n();
  const {
    isInstallPromptVisible,
    isNotificationPromptVisible,
    showNotificationPrompt,
  } = usePWAPrompt();

  const [isInstalling, setIsInstalling] = useState(false);
  const [installButtonsDisabled, setInstallButtonsDisabled] = useState(false);
  const [notificationButtonsDisabled, setNotificationButtonsDisabled] = useState(false);
  
  // Track dismissed state from localStorage to avoid hydration mismatches
  const [isInstallPromptDismissed, setIsInstallPromptDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED);
  });
  
  const [isNotificationPromptDismissed, setIsNotificationPromptDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED);
  });

  // Check if install prompt should actually be shown
  // Only show if app is installable, not installed, and not dismissed
  const shouldShowInstallPrompt =
    isInstallPromptVisible &&
    isInstallable &&
    !isInstalled &&
    !isInstallPromptDismissed;

  // Check if notification prompt should actually be shown
  // Only show if notifications are supported, permission is default, and not dismissed
  const shouldShowNotificationPrompt =
    isNotificationPromptVisible &&
    isSupported &&
    permission === "default" &&
    isReady &&
    !isNotificationPromptDismissed;

  // Disable install buttons for 500ms when dialog opens to prevent accidental clicks
  useEffect(() => {
    if (shouldShowInstallPrompt) {
      setInstallButtonsDisabled(true);
      const timer = setTimeout(() => {
        setInstallButtonsDisabled(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowInstallPrompt]);

  // Disable notification buttons for 500ms when dialog opens to prevent accidental clicks
  useEffect(() => {
    if (shouldShowNotificationPrompt) {
      setNotificationButtonsDisabled(true);
      const timer = setTimeout(() => {
        setNotificationButtonsDisabled(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowNotificationPrompt]);

  /**
   * Handles install button click.
   */
  const handleInstall = async () => {
    setIsInstalling(true);
    const accepted = await promptInstall();
    setIsInstalling(false);

    if (accepted) {
      // Don't mark as dismissed if user accepted
    } else {
      // User dismissed, remember it
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, "true");
        setIsInstallPromptDismissed(true);
      }
    }
  };

  /**
   * Handles install prompt dismissal.
   */
  const handleDismissInstall = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, "true");
      setIsInstallPromptDismissed(true);
    }
  };

  /**
   * Handles notification permission request.
   */
  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (!granted) {
      // User denied, remember it
      if (typeof window !== "undefined") {
        localStorage.setItem(
          STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED,
          "true"
        );
        setIsNotificationPromptDismissed(true);
      }
    }
    // Don't mark as dismissed if user accepted - they can use notifications now
  };

  /**
   * Handles notification prompt dismissal.
   */
  const handleDismissNotifications = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED, "true");
      setIsNotificationPromptDismissed(true);
    }
  };

  return (
    <>
      {/* Install Prompt */}
      <Dialog
        open={shouldShowInstallPrompt}
        onOpenChange={() => {
          // Prevent closing by clicking backdrop
        }}
      >
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(e: Event) => {
            e.preventDefault();
          }}
        >
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
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleDismissInstall}
              disabled={isInstalling || installButtonsDisabled}
              className="cursor-pointer"
            >
              {t("onboarding.install.dismiss")}
            </Button>
            <Button 
              onClick={handleInstall} 
              disabled={isInstalling || installButtonsDisabled} 
              className="cursor-pointer"
            >
              {isInstalling
                ? t("onboarding.install.installing")
                : t("onboarding.install.install")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Prompt */}
      <Dialog
        open={shouldShowNotificationPrompt}
        onOpenChange={() => {
          // Prevent closing by clicking backdrop
        }}
      >
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(e: Event) => {
            e.preventDefault();
          }}
        >
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
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDismissNotifications}
              disabled={notificationButtonsDisabled}
              className="cursor-pointer"
            >
              {t("onboarding.notifications.dismiss")}
            </Button>
            <Button
              onClick={handleEnableNotifications}
              disabled={notificationButtonsDisabled}
              className="cursor-pointer"
            >
              {t("onboarding.notifications.enable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
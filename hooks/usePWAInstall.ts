"use client";

import { useEffect, useState } from "react";

/**
 * Type for the beforeinstallprompt event.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Hook for managing PWA install prompt.
 * Detects when the browser shows the install prompt and provides a way to trigger it programmatically.
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (typeof window !== "undefined") {
      // Check if running in standalone mode (installed)
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      // Only set as installed if we're in standalone mode AND no install prompt is available
      // If beforeinstallprompt is available, it means the app can be installed (not installed)
      setIsInstalled(isStandalone);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      // If beforeinstallprompt is fired, the app is NOT installed (even if in standalone mode)
      setIsInstalled(false);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    if (typeof window !== "undefined") {
      window.addEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.addEventListener("appinstalled", handleAppInstalled);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "beforeinstallprompt",
          handleBeforeInstallPrompt
        );
        window.removeEventListener("appinstalled", handleAppInstalled);
      }
    };
  }, []);

  /**
   * Triggers the install prompt.
   * @returns Promise that resolves to true if user accepted, false if dismissed
   */
  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for user's response
      const { outcome } = await deferredPrompt.userChoice;

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setIsInstallable(false);

      return outcome === "accepted";
    } catch (error) {
      console.error("Error showing install prompt:", error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
}


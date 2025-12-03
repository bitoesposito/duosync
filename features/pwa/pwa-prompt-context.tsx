"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

/**
 * Context for managing PWA prompt visibility.
 * Allows other components to trigger install and notification prompts programmatically.
 */
interface PWAPromptContextValue {
  showInstallPrompt: () => void;
  showNotificationPrompt: () => void;
  isInstallPromptVisible: boolean;
  isNotificationPromptVisible: boolean;
}

const PWAPromptContext = createContext<PWAPromptContextValue | undefined>(undefined);

/**
 * Provider component that manages PWA prompt visibility state.
 * Should wrap the app layout to provide prompt control to all components.
 */
export function PWAPromptProvider({ children }: { children: ReactNode }) {
  const [isInstallPromptVisible, setIsInstallPromptVisible] = useState(false);
  const [isNotificationPromptVisible, setIsNotificationPromptVisible] = useState(false);

  const showInstallPrompt = useCallback(() => {
    setIsInstallPromptVisible(true);
  }, []);

  const showNotificationPrompt = useCallback(() => {
    setIsNotificationPromptVisible(true);
  }, []);

  return (
    <PWAPromptContext.Provider
      value={{
        showInstallPrompt,
        showNotificationPrompt,
        isInstallPromptVisible,
        isNotificationPromptVisible,
      }}
    >
      {children}
    </PWAPromptContext.Provider>
  );
}

/**
 * Hook to access PWA prompt context.
 * @throws Error if used outside PWAPromptProvider
 */
export function usePWAPrompt() {
  const context = useContext(PWAPromptContext);
  if (context === undefined) {
    throw new Error("usePWAPrompt must be used within PWAPromptProvider");
  }
  return context;
}




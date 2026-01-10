"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import {
  arrayBufferToBase64Url,
  base64UrlToArrayBuffer,
} from "@/lib/auth/passkeys-client";

type LoginMethod = "passkey" | "magic-link";

export default function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("passkey");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkEnabled, setIsMagicLinkEnabled] = useState(false);

  // Check if magic link is enabled
  useEffect(() => {
    fetch("/api/auth/magic-link/status")
      .then((res) => res.json())
      .then((data) => {
        setIsMagicLinkEnabled(data.enabled || false);
      })
      .catch((error) => {
        console.error("Failed to check magic link status:", error);
        setIsMagicLinkEnabled(false);
      });
  }, []);

  const handlePasskeyLogin = async () => {
    setIsLoading(true);

    try {
      // Step 1: Get WebAuthn challenge (no email filtering)
      const challengeResponse = await fetch("/api/auth/passkey/auth-challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const challengeData = await challengeResponse.json();

      if (!challengeData.success) {
        toast.error(t("errors.NETWORK_ERROR"));
        setIsLoading(false);
        return;
      }

      // Step 2: Get passkey from browser
      const publicKeyCredentialRequestOptions = {
        ...challengeData.options,
        challenge: base64UrlToArrayBuffer(challengeData.options.challenge),
        allowCredentials: challengeData.options.allowCredentials?.map((cred: any) => ({
          ...cred,
          id: base64UrlToArrayBuffer(cred.id),
        })),
      };

      let credential: PublicKeyCredential | null = null;
      
      try {
        credential = (await navigator.credentials.get({
          publicKey: publicKeyCredentialRequestOptions,
        })) as PublicKeyCredential | null;
      } catch (webauthnError) {
        // Handle WebAuthn-specific errors
        if (webauthnError instanceof Error) {
          if (webauthnError.name === "NotAllowedError") {
            // User cancelled or closed the authentication window
            toast.error(t("errors.PASSKEY_USER_CANCELLED"));
            setIsLoading(false);
            return;
          } else if (webauthnError.name === "NotSupportedError") {
            toast.error(t("errors.WEBAUTHN_NOT_SUPPORTED"));
            setIsLoading(false);
            return;
          } else if (webauthnError.name === "InvalidStateError") {
            toast.error(t("errors.PASSKEY_AUTH_FAILED"));
            setIsLoading(false);
            return;
          }
        }
        // Re-throw to be caught by outer catch block
        throw webauthnError;
      }

      if (!credential) {
        // User cancelled the operation
        toast.error(t("errors.PASSKEY_USER_CANCELLED"));
        setIsLoading(false);
        return;
      }

      const assertionResponse = credential.response as AuthenticatorAssertionResponse;

      // Step 3: Verify passkey authentication
      const verifyResponse = await fetch("/api/auth/passkey/auth-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: {
            id: arrayBufferToBase64Url(credential.rawId), // Use rawId as the canonical ID
            rawId: arrayBufferToBase64Url(credential.rawId),
            response: {
              clientDataJSON: arrayBufferToBase64Url(assertionResponse.clientDataJSON),
              authenticatorData: arrayBufferToBase64Url(
                assertionResponse.authenticatorData
              ),
              signature: arrayBufferToBase64Url(assertionResponse.signature),
              userHandle: assertionResponse.userHandle
                ? arrayBufferToBase64Url(assertionResponse.userHandle)
                : null,
            },
            type: credential.type,
            clientExtensionResults: {},
          },
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        const errorCode = verifyData.error?.code || "INTERNAL_ERROR";
        toast.error(t(`errors.${errorCode}`));
        setIsLoading(false);
        return;
      }

      // Step 4: Login user with token using NextAuth signIn
      // This ensures cookies are set correctly on the client side
      const result = await signIn("credentials", {
        token: verifyData.token,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        console.error("SignIn error:", result.error);
        toast.error(t("errors.NETWORK_ERROR"));
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        toast.success(t("auth.loginSuccess"));
        
        // Wait for session to be available before redirecting
        // Poll the session endpoint until we get a valid session
        let sessionAvailable = false;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!sessionAvailable && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          try {
            const sessionResponse = await fetch("/api/auth/session");
            const sessionData = await sessionResponse.json();
            if (sessionData?.user) {
              sessionAvailable = true;
              break;
            }
          } catch (error) {
            console.error("Error checking session:", error);
          }
          attempts++;
        }
        
        if (sessionAvailable) {
          // Use window.location.href to force a full page reload
          // This ensures the session is available when the page loads
          window.location.href = "/dashboard";
        } else {
          // Fallback: redirect anyway after delay
          console.warn("Session not confirmed, redirecting anyway");
          await new Promise((resolve) => setTimeout(resolve, 500));
          window.location.href = "/dashboard";
        }
      } else {
        toast.error(t("errors.NETWORK_ERROR"));
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);

      // Handle WebAuthn errors (fallback for errors not caught above)
      if (error instanceof Error) {
        if (error.name === "NotSupportedError") {
          toast.error(t("errors.WEBAUTHN_NOT_SUPPORTED"));
        } else if (error.name === "NotAllowedError") {
          // User cancelled or closed the authentication window
          toast.error(t("errors.PASSKEY_USER_CANCELLED"));
        } else if (error.name === "InvalidStateError") {
          toast.error(t("errors.PASSKEY_AUTH_FAILED"));
        } else {
          // Network or other errors
          toast.error(t("errors.NETWORK_ERROR"));
        }
      } else {
        toast.error(t("errors.NETWORK_ERROR"));
      }

      setIsLoading(false);
    }
  };

  const handleMagicLinkLogin = async () => {
    if (!email.trim()) {
      toast.error(t("errors.VALIDATION_ERROR"));
      return;
    }

    setIsLoading(true);

    try {
      // Check if magic link is enabled before attempting to sign in
      const statusResponse = await fetch("/api/auth/magic-link/status");
      const statusData = await statusResponse.json();
      
      if (!statusData.enabled) {
        toast.error(t("errors.MAGIC_LINK_NOT_CONFIGURED"));
        setIsLoading(false);
        return;
      }

      const result = await signIn("email", {
        email: email.trim(),
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        toast.error(t("errors.NETWORK_ERROR"));
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        toast.success(t("auth.magicLinkSent"));
        // Don't redirect immediately - user needs to click the link in email
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Magic link error:", error);
      toast.error(t("errors.NETWORK_ERROR"));
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loginMethod === "passkey") {
      await handlePasskeyLogin();
    } else {
      await handleMagicLinkLogin();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Login method selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("auth.loginMethod")}</label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={loginMethod === "passkey" ? "default" : "outline"}
            onClick={() => setLoginMethod("passkey")}
            className="flex-1"
            disabled={isLoading}
          >
            {t("auth.passkey")}
          </Button>
          <Button
            type="button"
            variant={loginMethod === "magic-link" ? "default" : "outline"}
            onClick={() => setLoginMethod("magic-link")}
            className="flex-1"
            disabled={isLoading}
          >
            {t("auth.magicLink")}
          </Button>
        </div>
      </div>

      {/* Email input only for magic link */}
      {loginMethod === "magic-link" && (
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            {t("common.email")}
          </label>
          <Input
            id="email"
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          <p className="text-xs text-muted-foreground">
            {t("auth.magicLinkHint")}
          </p>
        </div>
      )}

      {/* Passkey hint */}
      {loginMethod === "passkey" && (
        <p className="text-xs text-muted-foreground">
          {t("auth.passkeyLoginHint")}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t("common.submit") + "..." : t("common.login")}
      </Button>
    </form>
  );
}

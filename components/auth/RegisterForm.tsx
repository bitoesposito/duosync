"use client";

import { useState } from "react";
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

export default function RegisterForm() {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Step 1: Register user and get token
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerData.success) {
        const errorCode = registerData.error?.code || "INTERNAL_ERROR";
        
        // If email already exists with passkey, suggest login
        if (errorCode === "EMAIL_ALREADY_EXISTS") {
          toast.error(t(`errors.${errorCode}`), {
            action: {
              label: t("common.login"),
              onClick: () => router.push("/login"),
            },
          });
        } else {
          toast.error(t(`errors.${errorCode}`));
        }
        
        setIsLoading(false);
        return;
      }

      // Show info message if account was updated (re-registration)
      if (registerData.message) {
        toast.info(registerData.message);
      }

      // Step 2: Get WebAuthn challenge
      const challengeResponse = await fetch("/api/auth/passkey/register-challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: registerData.user.id,
          userName: registerData.user.name,
          userEmail: registerData.user.email,
        }),
      });

      const challengeData = await challengeResponse.json();

      if (!challengeData.success) {
        toast.error(t("errors.NETWORK_ERROR"));
        setIsLoading(false);
        return;
      }

      // Step 3: Create passkey
      // SimpleWebAuthn returns options in the correct format
      const publicKeyCredentialCreationOptions = {
        ...challengeData.options,
        challenge: base64UrlToArrayBuffer(challengeData.options.challenge),
        user: {
          ...challengeData.options.user,
          id: base64UrlToArrayBuffer(challengeData.options.user.id),
        },
      };

      let credential: PublicKeyCredential | null = null;
      
      try {
        credential = (await navigator.credentials.create({
          publicKey: publicKeyCredentialCreationOptions,
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
            toast.error(t("errors.PASSKEY_ALREADY_EXISTS"));
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

      const attestationResponse = credential.response as AuthenticatorAttestationResponse;

      // Step 4: Verify passkey registration
      const verifyResponse = await fetch("/api/auth/passkey/register-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: registerData.user.id,
          credential: {
            id: arrayBufferToBase64Url(credential.rawId), // Use rawId as the canonical ID
            rawId: arrayBufferToBase64Url(credential.rawId),
            response: {
              clientDataJSON: arrayBufferToBase64Url(attestationResponse.clientDataJSON),
              attestationObject: arrayBufferToBase64Url(
                attestationResponse.attestationObject
              ),
            },
            type: credential.type,
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

      // Step 5: Login user with token using NextAuth signIn
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
        toast.success(t("auth.registerSuccess"));
        
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
      console.error("Registration error:", error);

      // Handle WebAuthn errors (fallback for errors not caught above)
      if (error instanceof Error) {
        if (error.name === "NotSupportedError") {
          toast.error(t("errors.WEBAUTHN_NOT_SUPPORTED"));
        } else if (error.name === "NotAllowedError") {
          // User cancelled or closed the authentication window
          toast.error(t("errors.PASSKEY_USER_CANCELLED"));
        } else if (error.name === "InvalidStateError") {
          toast.error(t("errors.PASSKEY_ALREADY_EXISTS"));
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          {t("common.name")}
        </label>
        <Input
          id="name"
          type="text"
          placeholder={t("auth.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
          minLength={1}
          maxLength={100}
        />
      </div>

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
          required
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          {t("auth.emailRecoveryHint")}
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t("common.submit") + "..." : t("common.register")}
      </Button>
    </form>
  );
}

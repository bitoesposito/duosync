"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

/**
 * Onboarding page for user registration.
 * Asks for admin name and PIN only – no PIN confirmation.
 */
export default function OnboardingPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Submits the onboarding form.
   * Validates that the PIN has 6 digits before sending.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length !== 6) {
      toast.error(t("onboarding.setup.errorPinLength"));
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, pin }),
      });

      if (!response.ok) throw new Error("Onboarding failed");

      toast.success(t("onboarding.setup.success"));
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t("onboarding.setup.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center bg-background p-4 pt-8 md:pt-4">
      <Card className="w-full max-w-xs">
        <CardHeader className="text-center">
          <CardTitle>{t("onboarding.setup.title")}</CardTitle>
          <CardDescription>{t("onboarding.setup.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-2 flex flex-col gap-2">
              <Label htmlFor="userName">{t("onboarding.setup.adminNameLabel")}</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t("onboarding.setup.namePlaceholder")}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2 flex flex-col gap-2">
              <Label htmlFor="pin">{t("onboarding.setup.pinLabel")}</Label>
              <InputOTP
                maxLength={6}
                value={pin}
                onChange={setPin}
                disabled={isSubmitting}
                inputMode="numeric"
                className="w-full"
              >
                <InputOTPGroup className="w-full flex gap-2">
                  <InputOTPSlot index={0} className="flex-1" />
                  <InputOTPSlot index={1} className="flex-1" />
                  <InputOTPSlot index={2} className="flex-1" />
                  <InputOTPSlot index={3} className="flex-1" />
                  <InputOTPSlot index={4} className="flex-1" />
                  <InputOTPSlot index={5} className="flex-1" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              type="submit"
              className="w-full mt-4 cursor-pointer"
              disabled={isSubmitting || !userName || pin.length !== 6}
            >
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {t("onboarding.setup.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

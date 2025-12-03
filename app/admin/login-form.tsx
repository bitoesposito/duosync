"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2Icon, LockIcon } from "lucide-react";
import { toast } from "sonner";

/**
 * Admin login form component.
 * Handles PIN entry and authentication for admin area access.
 */
export default function AdminLoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) {
        toast.error(t("admin.login.error"));
        return;
      }

      toast.success(t("admin.login.success"));
      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t("admin.login.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center bg-background p-4 pt-8 md:pt-4">
      <Card className="w-full max-w-xs">
        <CardHeader className="text-center">
          <CardTitle>{t("admin.login.title")}</CardTitle>
          <CardDescription>{t("admin.login.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-2 flex flex-col gap-2">
              <Label htmlFor="pin">{t("admin.login.pinLabel")}</Label>
              <InputOTP
                maxLength={6}
                value={pin}
                onChange={setPin}
                disabled={isSubmitting}
                autoFocus
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

            <Button type="submit" className="w-full mt-4 cursor-pointer" disabled={isSubmitting || pin.length < 6}>
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.login.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

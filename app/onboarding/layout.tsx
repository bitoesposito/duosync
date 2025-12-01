import { isAppInitialized } from "@/lib/settings";
import { redirect } from "next/navigation";

/**
 * Layout for onboarding route.
 * Redirects to home if the app is already initialized.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialized = await isAppInitialized();

  if (initialized) {
    redirect("/");
  }

  return <>{children}</>;
}
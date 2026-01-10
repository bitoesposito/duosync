import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import RegisterForm from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const t = await getTranslations();
  const session = await auth();

  // Redirect if already authenticated
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-background p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t("auth.registerTitle")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("auth.registerDescription")}
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}



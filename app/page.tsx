import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const t = await getTranslations();
  const session = await auth();

  // Redirect to dashboard if authenticated
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-16 py-32">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            {t("common.welcome")}
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            DuoSync - Sync your busy intervals with friends
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild>
            <Link href="/register">{t("common.register")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">{t("common.login")}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}


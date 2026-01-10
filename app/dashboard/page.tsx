import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function DashboardPage() {
  const t = await getTranslations();
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("common.dashboard")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("common.welcome")}, {session.user?.name || session.user?.email}!
          </p>
        </div>
        <LogoutButton />
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">
          Dashboard content will be here...
        </p>
      </div>
    </div>
  );
}


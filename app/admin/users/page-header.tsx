"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { useI18n } from "@/i18n";

/**
 * Header component for the admin users page.
 * Displays the page title and a back button to the dashboard.
 */
export default function PageHeader() {
  const { t } = useI18n();

  return (
    <header className="space-y-0.5 flex items-center gap-2">
      <Button variant="outline" asChild>
        <Link href="/">
          <ArrowLeftIcon className="w-4 h-4" />
        </Link>
      </Button>
      <h2 className="text-xl font-medium tracking-tight">{t("admin.users.title")}</h2>
    </header>
  );
}


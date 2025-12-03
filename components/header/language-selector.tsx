"use client";

import { GlobeIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, SUPPORTED_LOCALES } from "@/i18n";
import { type Locale } from "@/types";

/**
 * Language selector component for the header.
 * Allows users to switch between supported locales.
 */
export default function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer rounded-none h-10 w-10 hover:bg-transparent hover:text-muted-foreground"
          aria-label={t("header.language")}
        >
          <GlobeIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        {SUPPORTED_LOCALES.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLocale(code as Locale)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="text-sm font-medium">{code.toUpperCase()}</span>
            {code === locale && (
              <CheckIcon className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

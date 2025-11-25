"use client";

import * as React from "react";
import {
  CheckIcon,
  GlobeIcon,
  MoonIcon,
  SunIcon,
  UsersIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUsers, useI18n } from "@/hooks";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { users, activeUser, selectUser } = useUsers();
  const { locale, setLocale, t } = useI18n();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="max-w-5xl mx-auto py-2 px-4 lg:px-0 flex justify-between items-center gap-2 border-b border-border">
        <div id="logo" className="flex items-center gap-2 select-none">
          <UsersIcon className="w-6 h-6 text-foreground" />
          <p className="font-medium text-lg text-foreground tracking-tight">
            {t("header.appName")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer rounded-none h-10 w-10 hover:bg-transparent hover:text-muted-foreground"
            onClick={toggleTheme}
          >
            <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer rounded-none font-medium"
              >
                <GlobeIcon className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {locale.toUpperCase() || t("header.selectLanguageFallback")}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[12rem]">
              <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("header.language")}
              </DropdownMenuLabel>
              {SUPPORTED_LOCALES.map((code) => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => setLocale(code as Locale)}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium">
                    {code === "it"
                      ? t("header.languageItalian")
                      : t("header.languageEnglish")}
                  </span>
                  {code === locale ? (
                    <CheckIcon className="w-4 h-4 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="cursor-pointer rounded-none font-medium"
                variant="outline"
              >
                <UsersIcon className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {activeUser?.name ?? t("header.selectUserFallback")}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[14rem]">
              <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("header.availableUsers")}
              </DropdownMenuLabel>
              {users.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => selectUser(user.id)}
                  className="flex items-start justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {user.name}
                    </span>
                  </div>
                  {user.id === activeUser?.id ? (
                    <CheckIcon className="w-4 h-4 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
    </header>
  );
}

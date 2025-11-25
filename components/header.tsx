"use client";

import * as React from "react";
import { MoonIcon, SunIcon, UsersIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="max-w-5xl mx-auto py-2 px-4 lg:px-0 flex justify-between items-center gap-2 border-b border-border">
        <div id="logo" className="flex items-center gap-2 select-none">
          <UsersIcon className="w-6 h-6 text-foreground" />
          <p className="font-medium text-lg text-foreground tracking-tight">
            DuoSync
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

          <Button
            className="cursor-pointer rounded-none font-medium"
            variant="outline"
          >
            <UsersIcon className="w-4 h-4 mr-2" />
            <span className="text-sm">Switch user</span>
          </Button>
        </div>
    </header>
  );
}

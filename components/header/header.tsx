"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { CheckIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUsers } from "@/features/users";
import { useI18n } from "@/i18n";
import SettingsMenu from "./settings-menu";
import HeaderUserSkeleton from "./header-user-skeleton";

export default function Header() {
  const { users, activeUser, selectUser, isLoading } = useUsers();
  const { t } = useI18n();
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering DropdownMenus after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <header className="max-w-5xl mx-auto py-2 px-4 lg:px-0 flex justify-between items-center gap-2 border-b border-border">
      <div id="logo" className="flex items-center gap-2 select-none">
        <UsersIcon className="w-6 h-6 text-foreground" />
        <p className="font-medium text-lg text-foreground tracking-tight">
          {t("header.appName")}
        </p>
      </div>

      <div className="flex items-center gap-2">
          {isLoading ? (
            <HeaderUserSkeleton />
          ) : isMounted ? (
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
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{user.name}</span>
                    {user.id === activeUser?.id && (
                      <CheckIcon className="w-4 h-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              className="cursor-pointer rounded-none font-medium"
              variant="outline"
              disabled
            >
              <UsersIcon className="w-4 h-4 mr-2" />
              <span className="text-sm">
                {activeUser?.name ?? t("header.selectUserFallback")}
              </span>
            </Button>
          )}

          {/* Settings Menu */}
          <SettingsMenu />
        </div>
    </header>
  );
}


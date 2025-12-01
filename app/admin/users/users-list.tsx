"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, UserIcon, SearchIcon, TrashIcon, Loader2Icon } from "lucide-react";
import { useI18n } from "@/i18n";
import { deleteUser } from "@/features/users/services/users.service";
import { toast } from "sonner";
import { MAX_USERS } from "@/lib/config/users";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UsersListProps {
  users: UserProfile[];
  selectedUserId?: number;
}

/**
 * Users list component with search.
 * On mobile, clicking a user scrolls to the user details section.
 * Since the maximum number of users is limited to 10, pagination is not needed.
 */
export default function UsersList({ users, selectedUserId }: UsersListProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter((user) => user.name.toLowerCase().includes(query));
  }, [users, searchQuery]);

  /**
   * Handles search input changes.
   */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  /**
   * Handles opening the delete confirmation dialog.
   * Prevents event propagation to avoid triggering the link navigation.
   */
  const handleDeleteClick = (e: React.MouseEvent, user: UserProfile) => {
    e.preventDefault();
    e.stopPropagation();
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  /**
   * Handles deleting a user.
   */
  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await deleteUser(userToDelete.id);
      toast.success(t("admin.users.messages.deleteSuccess"));
      setShowDeleteDialog(false);
      setUserToDelete(null);
      
      // If deleted user was selected, redirect to users list
      if (userToDelete.id === selectedUserId) {
        router.push("/admin/users");
      }
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t("admin.users.messages.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="w-full flex flex-col gap-0 border-b border-border md:border-b-0 bg-background md:bg-transparent">
      <header className="flex items-center justify-between py-3 md:pt-0 pt-3">
        <h2 className="text-lg font-medium tracking-tight text-foreground">
          {t("admin.users.listTitle")}
        </h2>
      </header>

      <div className="block">
        <div className="flex flex-col gap-4 pb-6 md:pb-0">
          {/* Search Bar */}
          <div className="flex flex-col gap-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("admin.users.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 bg-transparent border-border rounded-none h-10 text-sm"
              />
            </div>
          </div>

          {/* New User Button */}
          {users.length >= MAX_USERS ? (
            <Button 
              className="w-full justify-start rounded-none h-10 text-sm" 
              variant="outline"
              disabled={true}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              {t("admin.users.newUser")}
            </Button>
          ) : (
            <Button 
              asChild 
              className="w-full justify-start rounded-none h-10 text-sm" 
              variant="outline"
            >
              <Link href="/admin/users?new=true">
                <PlusIcon className="mr-2 h-4 w-4" />
                {t("admin.users.newUser")}
              </Link>
            </Button>
          )}

          {/* Users List */}
          <div className="flex flex-col max-h-[400px] overflow-y-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center justify-between gap-2 p-2 text-sm transition-colors hover:bg-muted/50 border-b border-border last:border-b-0 group",
                    selectedUserId === user.id ? "bg-muted font-medium" : "text-muted-foreground"
                  )}
                >
                  <Link
                    href={`/admin/users?userId=${user.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="flex h-8 w-8 items-center justify-center bg-primary/10 shrink-0">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="truncate">{user.name}</span>
                  </Link>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handleDeleteClick(e, user)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-transparent rounded-none opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    aria-label={t("admin.users.details.delete")}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {t("admin.users.noUsers")}
              </div>
            )}
          </div>

          {/* Max Users Message */}
          {users.length >= MAX_USERS && (
            <div className="w-full p-3 bg-muted/50 rounded border border-border text-sm text-muted-foreground text-center">
              {t("admin.users.messages.maxUsersReached", { max: MAX_USERS })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.users.deleteModal.title")}</DialogTitle>
            <DialogDescription>
              {t("admin.users.deleteModal.description", { name: userToDelete?.name || "--" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t("admin.users.deleteModal.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.users.deleteModal.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

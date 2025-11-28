"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, UserIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon, Loader2Icon } from "lucide-react";
import { useI18n } from "@/i18n";
import { deleteUser } from "@/features/users/services/users.service";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface UsersListProps {
  users: UserProfile[];
  selectedUserId?: number;
}

const ITEMS_PER_PAGE = 8;

/**
 * Users list component with search, pagination, and collapsible header on mobile.
 * Follows the same pattern as the appointments form in the dashboard.
 */
export default function UsersList({ users, selectedUserId }: UsersListProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false); // Default collapsed on mobile
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter((user) => user.name.toLowerCase().includes(query));
  }, [users, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  /**
   * Handles search input changes and resets pagination to page 1.
   */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
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
      <header
        className="flex items-center justify-between py-3 md:pt-0 pt-3 md:cursor-default cursor-pointer hover:opacity-70 md:hover:opacity-100 transition-opacity"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-lg font-medium tracking-tight text-foreground">
          {t("admin.users.listTitle")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground hover:text-foreground hover:bg-transparent rounded-none h-8 w-8 cursor-pointer"
        >
          {isOpen ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </Button>
      </header>

      <div className={`${isOpen ? "block" : "hidden"} md:block`}>
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
          <Button asChild className="w-full justify-start rounded-none h-10 text-sm" variant="outline">
            <Link href="/admin/users?new=true">
              <PlusIcon className="mr-2 h-4 w-4" />
              {t("admin.users.newUser")}
            </Link>
          </Button>

          {/* Users List */}
          <div className="flex flex-col max-h-[400px] overflow-y-auto">
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
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

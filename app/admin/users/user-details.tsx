"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, updateUser, deleteUser } from "@/features/users/services/users.service";
import { Loader2Icon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n";

interface UserDetailsProps {
  user?: UserProfile;
  showNewUserForm?: boolean;
}

/**
 * User details component for creating/editing users.
 */
export default function UserDetails({ user, showNewUserForm = false }: UserDetailsProps) {
  const router = useRouter();
  const { t } = useI18n();
  
  // Form state
  const [name, setName] = useState(user?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Update form when user prop changes
  useEffect(() => {
    setName(user?.name || "");
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      if (user) {
        await updateUser(user.id, name.trim());
        toast.success(t("admin.users.messages.updateSuccess"));
      } else {
        const newUser = await createUser(name.trim());
        toast.success(t("admin.users.messages.createSuccess"));
      }
      router.refresh();
      if (!user) setName(""); // Reset if create mode
    } catch (error) {
      console.error(error);
      toast.error(user ? t("admin.users.messages.updateError") : t("admin.users.messages.createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      await deleteUser(user.id);
      toast.success(t("admin.users.messages.deleteSuccess"));
      setShowDeleteDialog(false);
      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t("admin.users.messages.deleteError"));
    } finally {
      setIsSubmitting(false);
    }
  };


  // If no user selected, show welcome message or new user form
  if (!user) {
    // Show new user form if "new" parameter is present
    if (showNewUserForm) {
      return (
        <div className="flex flex-col gap-6">
          {/* Create Form Section */}
          <section className="w-full flex flex-col gap-0 border-b border-border pb-6">
            <header className="space-y-0.5 pb-4">
              <h2 className="text-lg font-medium tracking-tight text-foreground">
                {t("admin.users.details.createTitle")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t("admin.users.details.createDescription")}
              </p>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="name"
                  className="text-muted-foreground text-xs font-medium uppercase"
                >
                  {t("admin.users.details.nameLabel")}
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("admin.users.details.namePlaceholder")}
                  required
                  disabled={isSubmitting}
                  className="bg-transparent border-border rounded-none h-10 text-sm"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isSubmitting || !name.trim()}
                  className="rounded-none h-10 text-sm font-medium tracking-wide"
                >
                  {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  {t("admin.users.details.save")}
                </Button>
              </div>
            </form>
          </section>
        </div>
      );
    }

    // Otherwise show welcome message
    return (
      <div className="flex flex-col gap-6">
        <section className="w-full flex flex-col gap-0">
          <div className="py-12 border border-dashed border-border bg-muted/5 text-center flex flex-col items-center justify-center gap-4">
            <h2 className="text-lg font-medium tracking-tight text-foreground">
              {t("admin.users.details.welcomeTitle")}
            </h2>
            <p className="text-muted-foreground text-sm max-w-md">
              {t("admin.users.details.welcomeDescription")}
            </p>
          </div>
        </section>
      </div>
    );
  }

  // If user selected, show edit form
  return (
    <div className="flex flex-col gap-6">
      {/* Edit Form Section */}
      <section className="w-full flex flex-col gap-0 border-b border-border pb-6">
        <header className="space-y-0.5 pb-4">
          <h2 className="text-lg font-medium tracking-tight text-foreground">
            {t("admin.users.details.editTitle")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("admin.users.details.id")}: {user.id}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="name"
              className="text-muted-foreground text-xs font-medium uppercase"
            >
              {t("admin.users.details.nameLabel")}
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("admin.users.details.namePlaceholder")}
              required
              disabled={isSubmitting}
              className="bg-transparent border-border rounded-none h-10 text-sm"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSubmitting}
              className="rounded-none h-10 text-sm font-medium tracking-wide"
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              {t("admin.users.details.delete")}
            </Button>
            
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting || !name.trim()}
              className="rounded-none h-10 text-sm font-medium tracking-wide"
            >
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.users.details.update")}
            </Button>
          </div>
        </form>
      </section>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.users.deleteModal.title")}</DialogTitle>
            <DialogDescription>
              {t("admin.users.deleteModal.description", { name: user?.name || "--" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t("admin.users.deleteModal.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.users.deleteModal.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

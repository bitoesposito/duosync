import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UsersProvider } from "@/features/users";
import Header from "@/components/header/header";

/**
 * Layout for admin routes.
 * Provides UsersProvider and Header for all admin pages.
 * Note: Individual pages handle their own authentication checks.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UsersProvider>
      <div className="min-h-screen bg-background">
        <Header />
        {children}
      </div>
    </UsersProvider>
  );
}


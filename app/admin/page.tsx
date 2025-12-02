import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminLoginForm from "./login-form";

export const dynamic = 'force-dynamic';

/**
 * Admin login page entrypoint.
 * Redirects to /admin/users if already authenticated, otherwise shows login form.
 */
export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_session");

  if (isAdmin) {
    redirect("/admin/users");
  }

  return <AdminLoginForm />;
}


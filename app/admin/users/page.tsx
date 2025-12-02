import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUsersFromDb } from "@/features/users/services/users.db.service";
import UsersList from "./users-list";
import UserDetails from "./user-details";
import PageHeader from "./page-header";

export const dynamic = 'force-dynamic';

/**
 * Admin users management page.
 * Displays a list of users on the left (4 columns) and user details on the right (8 columns).
 * Structure matches the dashboard layout for consistency.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; new?: string }>;
}) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_session");

  if (!isAdmin) {
    redirect("/admin");
  }

  // Fetch users server-side for initial render
  const users = await getUsersFromDb();
  
  // Resolve searchParams Promise (Next.js 16+)
  const resolvedSearchParams = await searchParams;
  
  // Parse userId from searchParams (handle both string and array cases)
  const userIdParam = resolvedSearchParams.userId;
  const selectedUserId = userIdParam 
    ? (Array.isArray(userIdParam) ? parseInt(userIdParam[0]) : parseInt(userIdParam))
    : undefined;
  
  // Find selected user only if userId is valid
  const selectedUser = selectedUserId && !isNaN(selectedUserId)
    ? users.find((u) => u.id === selectedUserId)
    : undefined;

  // Check if "new" parameter is present
  const newParam = resolvedSearchParams.new;
  const showNewUserForm = newParam === "true";

  return (
    <main className="max-w-5xl mx-auto py-4 px-4 lg:px-0 flex flex-col gap-4 relative">
      <PageHeader />

      <div className="grid grid-cols-12 gap-4 items-start">
        {/* Left Column: Users List (4 columns on md, 3 on lg, full width on mobile) */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 md:sticky md:top-6 relative z-10 md:z-auto">
          <UsersList users={users} selectedUserId={selectedUserId} />
        </div>

        {/* Right Column: User Details / Edit (8 columns on md, 9 on lg, full width on mobile) */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col gap-6">
          <UserDetails user={selectedUser} showNewUserForm={showNewUserForm} currentUserCount={users.length} />
        </div>
      </div>
    </main>
  );
}


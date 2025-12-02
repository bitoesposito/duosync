import Dashboard from "@/components/dashboard";
import Header from "@/components/header/header";
import { UsersProvider } from "@/features/users";
import { isAppInitialized } from "@/lib/settings";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const initialized = await isAppInitialized();
  
  if (!initialized) {
    redirect("/onboarding");
  }

  return (
    <UsersProvider>
      <div className="min-h-screen">
        <Header />
        <Dashboard />
      </div>
    </UsersProvider>
  );
}

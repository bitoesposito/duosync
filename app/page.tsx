import Header from "@/components/header";
import Dashboard from "@/components/dashboard";
import { UsersProvider } from "@/features/users";

export default function Home() {
  return (
   <UsersProvider>
    <div className="min-h-screen">
      <Header />
      <Dashboard />
    </div>
   </UsersProvider>
  );
}

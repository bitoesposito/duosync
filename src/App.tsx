import { useEffect } from "react";
import Header from "@/components/header/header";
import Dashboard from "@/components/dashboard";
import { useUsers } from "@/features/users/useUsers";
import { useUiStore } from "@/store/ui";

export function App() {
  const { users, activeUser } = useUsers();
  const setActiveUserId = useUiStore((s) => s.setActiveUserId);

  // Default to the first user once the list loads.
  useEffect(() => {
    if (users.length > 0 && !activeUser) setActiveUserId(users[0].id);
  }, [users, activeUser, setActiveUserId]);

  return (
    <div className="min-h-screen">
      <Header />
      <Dashboard />
    </div>
  );
}

export default App;

import { UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="py-3 px-4 shadow-sm">
      <div className="flex justify-between items-center gap-2 max-w-3xl mx-auto">
        <div id="logo" className="flex items-center gap-2 select-none">
          <span className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <UsersIcon className="w-5 h-5 text-white" />
          </span>
          <p className="font-bold text-gray-800 tracking-tight">DuoSync</p>
        </div>

        <Button className="cursor-pointer" variant="outline">
          <UsersIcon className="w-4 h-4" />
          <span className="text-sm">User name</span>
        </Button>
        
      </div>
    </header>
  );
}
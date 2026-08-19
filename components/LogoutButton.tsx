"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3.5 text-left text-sm font-medium text-sodium"
    >
      <LogOut size={16} strokeWidth={2} />
      Sair
    </button>
  );
}

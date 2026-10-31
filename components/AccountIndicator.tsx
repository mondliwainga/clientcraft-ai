"use client";

import { useAuth } from "@/lib/auth/useAuth";

interface AccountIndicatorProps {
  darkMode: boolean;
}

export function AccountIndicator({ darkMode }: AccountIndicatorProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={`text-xs truncate max-w-[200px] ${darkMode ? "text-secondary" : "text-secondary"}`}
      >
        {user.email}
      </span>
      <button
        type="button"
        onClick={logout}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
          darkMode
            ? "border-border bg-card text-foreground hover:bg-border"
            : "border-border bg-card text-navy hover:bg-background"
        }`}
      >
        Sign out
      </button>
    </div>
  );
}

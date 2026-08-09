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
        className={`text-xs truncate max-w-[200px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        {user.email}
      </span>
      <button
        type="button"
        onClick={logout}
        className={`rounded-md px-3 py-1.5 text-xs font-medium ring-1 transition ${
          darkMode
            ? "bg-gray-700 text-gray-300 ring-gray-600 hover:bg-gray-600"
            : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-100"
        }`}
      >
        Sign out
      </button>
    </div>
  );
}

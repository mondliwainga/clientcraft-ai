"use client";

import { useAuth } from "@/lib/auth/useAuth";

interface UsageCounterProps {
  darkMode: boolean;
}

export function UsageCounter({ darkMode }: UsageCounterProps) {
  const { tier, usageCount, remainingCount } = useAuth();

  // Don't show for pro users
  if (tier === "pro") return null;

  const isAtLimit = remainingCount === 0;

  return (
    <div
      className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-xs ${
        isAtLimit
          ? "border border-amber-200 bg-amber-50 text-amber-700"
          : darkMode
            ? "bg-gray-700/50 text-gray-400"
            : "bg-gray-100 text-gray-500"
      }`}
    >
      <span>
        {isAtLimit
          ? "Daily limit reached — resets at midnight UTC"
          : `${remainingCount} of 5 generations remaining today`}
      </span>
      <span className="font-medium">
        {usageCount}/5
      </span>
    </div>
  );
}

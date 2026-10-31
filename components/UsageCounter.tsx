"use client";

import { useAuth } from "@/lib/auth/useAuth";

interface UsageCounterProps {
  darkMode: boolean;
  onUpgrade?: () => void;
}

export function UsageCounter({ darkMode, onUpgrade }: UsageCounterProps) {
  const { tier, usageCount, remainingCount } = useAuth();

  if (tier === "pro") {
    return (
      <div className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs ${
        darkMode ? "bg-success/10 text-success" : "bg-success/5 text-success border border-success/20"
      }`}>
        <span>Pro plan · Unlimited generations</span>
        <span className="font-semibold">✓ Pro</span>
      </div>
    );
  }

  const isAtLimit = remainingCount === 0;

  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs ${
      isAtLimit
        ? "border border-warning/30 bg-warning/5 text-warning"
        : darkMode
          ? "bg-card border border-border text-secondary"
          : "bg-background border border-border text-secondary"
    }`}>
      <span>
        {isAtLimit
          ? "Daily limit reached"
          : `${remainingCount} of 5 generations remaining today`}
      </span>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{usageCount}/5</span>
        {isAtLimit && onUpgrade && (
          <button
            type="button"
            onClick={onUpgrade}
            className="ml-2 rounded-lg bg-[#8B5CF6] px-3 py-1 text-xs font-medium text-white hover:bg-[#8B5CF6]-hover transition"
          >
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
}

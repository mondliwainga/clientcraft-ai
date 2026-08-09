"use client";

import {
  createContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const DAILY_LIMIT = 5;

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  tier: "free" | "pro" | null;
  usageCount: number;
  remainingCount: number;
  refreshUsage: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  tier: null,
  usageCount: 0,
  remainingCount: DAILY_LIMIT,
  refreshUsage: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<"free" | "pro" | null>(null);
  const [usageCount, setUsageCount] = useState(0);

  const fetchProfile = useCallback(async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTier(data.tier);
        setUsageCount(data.usageCount);
      }
    } catch {
      // Fail silently — usage will show as 0
    }
  }, []);

  const refreshUsage = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser);
      } else {
        setTier(null);
        setUsageCount(0);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchProfile]);

  const remainingCount =
    tier === "pro" ? Infinity : Math.max(0, DAILY_LIMIT - usageCount);

  return (
    <AuthContext.Provider
      value={{ user, loading, tier, usageCount, remainingCount, refreshUsage }}
    >
      {children}
    </AuthContext.Provider>
  );
}

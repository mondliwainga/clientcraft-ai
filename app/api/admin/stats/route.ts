import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "clientcraft-admin-2026";

export async function GET(request: Request) {
  // Simple password protection via header
  const authHeader = request.headers.get("x-admin-secret");
  if (authHeader !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  try {
    // Get all users
    const usersSnapshot = await db.collection("users").get();
    const totalUsers = usersSnapshot.size;

    const users: {
      email: string;
      tier: string;
      createdAt: string;
      todayUsage: number;
    }[] = [];

    let activeToday = 0;
    let hitLimitToday = 0;

    // For each user, check today's usage
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const usageDoc = await db
        .collection("users")
        .doc(userDoc.id)
        .collection("usage")
        .doc(today)
        .get();

      const todayUsage = usageDoc.exists ? (usageDoc.data()?.count ?? 0) : 0;

      if (todayUsage > 0) activeToday++;
      if (todayUsage >= 5 && userData.tier !== "pro") hitLimitToday++;

      users.push({
        email: userData.email || "unknown",
        tier: userData.tier || "free",
        createdAt: userData.createdAt?.toDate?.()?.toISOString?.() || "unknown",
        todayUsage,
      });
    }

    // Sort by today's usage (most active first)
    users.sort((a, b) => b.todayUsage - a.todayUsage);

    return NextResponse.json({
      date: today,
      totalUsers,
      activeToday,
      hitLimitToday,
      users,
    });
  } catch (error: unknown) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

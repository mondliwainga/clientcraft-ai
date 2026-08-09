import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  getUserTier,
  getUserUsageCount,
  ensureUserDocument,
} from "@/lib/usage/tracker";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let uid: string;
    let email: string;

    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      uid = decoded.uid;
      email = decoded.email ?? "";
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Ensure user document exists (handles first-time users)
    await ensureUserDocument(uid, email);

    const [tier, usageCount] = await Promise.all([
      getUserTier(uid),
      getUserUsageCount(uid),
    ]);

    return NextResponse.json({ tier, usageCount });
  } catch (error: unknown) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

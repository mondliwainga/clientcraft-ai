import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Verify auth
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const token = authHeader.split("Bearer ")[1];
  let email: string;

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    email = decoded.email ?? "";
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }

  if (!email) {
    return NextResponse.json(
      { error: "No email associated with account" },
      { status: 400 }
    );
  }

  // 2. Initialize Paystack transaction for subscription
  try {
    const res = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          plan: process.env.PAYSTACK_PLAN_CODE,
          callback_url: `${request.headers.get("origin") || "https://clientcraft-ai.vercel.app"}/dashboard?upgraded=true`,
        }),
      }
    );

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || "Failed to initialize payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error: unknown) {
    console.error("Paystack init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}

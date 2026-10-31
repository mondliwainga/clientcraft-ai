import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  // Verify webhook signature
  const hash = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const db = getDb();

  try {
    switch (event.event) {
      case "subscription.create":
      case "charge.success": {
        // User subscribed successfully
        const email =
          event.data?.customer?.email || event.data?.email || "";
        if (email) {
          // Find user by email and upgrade to pro
          const usersRef = db.collection("users");
          const snapshot = await usersRef
            .where("email", "==", email)
            .limit(1)
            .get();

          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            await userDoc.ref.update({
              tier: "pro",
              paystackCustomerCode:
                event.data?.customer?.customer_code || "",
              subscriptionCode:
                event.data?.subscription_code || "",
              upgradedAt: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case "subscription.disable":
      case "subscription.not_renew": {
        // Subscription cancelled
        const email =
          event.data?.customer?.email || "";
        if (email) {
          const usersRef = db.collection("users");
          const snapshot = await usersRef
            .where("email", "==", email)
            .limit(1)
            .get();

          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            await userDoc.ref.update({ tier: "free" });
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true });
}

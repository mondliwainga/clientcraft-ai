import { getDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const DAILY_LIMIT = 5;

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD UTC
}

function getUsageDocRef(uid: string, date: string) {
  return getDb().collection("users").doc(uid).collection("usage").doc(date);
}

function getUserDocRef(uid: string) {
  return getDb().collection("users").doc(uid);
}

export interface UsageCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
}

export async function checkUsage(
  uid: string,
  tier: string
): Promise<UsageCheckResult> {
  if (tier === "pro") {
    return { allowed: true, currentCount: 0, limit: Infinity };
  }

  const date = getTodayDateString();
  const docRef = getUsageDocRef(uid, date);
  const doc = await docRef.get();
  const currentCount = doc.exists ? (doc.data()?.count ?? 0) : 0;

  return {
    allowed: currentCount < DAILY_LIMIT,
    currentCount,
    limit: DAILY_LIMIT,
  };
}

export async function incrementUsage(uid: string): Promise<void> {
  const date = getTodayDateString();
  const docRef = getUsageDocRef(uid, date);

  await docRef.set(
    {
      count: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserTier(uid: string): Promise<string> {
  const docRef = getUserDocRef(uid);
  const doc = await docRef.get();
  return doc.exists ? (doc.data()?.tier ?? "free") : "free";
}

export async function ensureUserDocument(
  uid: string,
  email: string
): Promise<void> {
  const docRef = getUserDocRef(uid);
  const doc = await docRef.get();

  if (!doc.exists) {
    await docRef.set({
      uid,
      email,
      tier: "free",
      createdAt: FieldValue.serverTimestamp(),
    });
  }
}

export async function getUserUsageCount(uid: string): Promise<number> {
  const date = getTodayDateString();
  const docRef = getUsageDocRef(uid, date);
  const doc = await docRef.get();
  return doc.exists ? (doc.data()?.count ?? 0) : 0;
}

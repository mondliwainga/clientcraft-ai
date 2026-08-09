# Design Document: Freelancer Monetization

## Overview

This design adds an MVP monetization layer to ClientCraft AI: Firebase Authentication (email + Google OAuth), Firestore-based daily usage tracking, and free-tier enforcement (5 generations/day). The single-page architecture is preserved — all auth UI, generation form, and results remain on the same page, driven by client-side state.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Auth UI     │  │  Generation  │  │  Usage Counter   │  │
│  │  (sign-in/   │  │  Form        │  │  Display         │  │
│  │   register)  │  │              │  │                  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                  │                   │            │
│  ┌──────▼──────────────────▼───────────────────▼─────────┐  │
│  │              AuthProvider (React Context)              │  │
│  │         Firebase Client SDK + onAuthStateChanged      │  │
│  └───────────────────────┬───────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │ ID Token in Authorization header
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                  Next.js API Route: /api/generate             │
│                                                              │
│  ┌────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Token     │  │  Usage Check /  │  │  OpenAI Stream   │  │
│  │  Verify    │──▶  Increment      │──▶  Generation      │  │
│  │  (Admin)   │  │  (Firestore)    │  │                  │  │
│  └────────────┘  └─────────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                     Firebase Services                         │
│                                                              │
│  ┌─────────────────────┐    ┌────────────────────────────┐  │
│  │  Firebase Auth       │    │  Cloud Firestore           │  │
│  │  (email + Google)    │    │  users/{uid}               │  │
│  │                      │    │  users/{uid}/usage/{date}  │  │
│  └─────────────────────┘    └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Component Interactions

1. **Client loads** → `AuthProvider` subscribes to `onAuthStateChanged`
2. **User not authenticated** → render sign-in/register UI, hide generation form
3. **User authenticates** → state updates, render generation form + usage counter
4. **User generates** → client sends request with `Authorization: Bearer <idToken>` → API route verifies token → checks usage → streams response
5. **User signs out** → state clears, render sign-in UI

## Data Models

### Firestore Schema

```typescript
// Collection: users/{uid}
interface UserDocument {
  uid: string;
  email: string;
  tier: "free" | "pro";
  createdAt: Timestamp; // Firestore server timestamp
}

// Subcollection: users/{uid}/usage/{YYYY-MM-DD}
interface UsageDocument {
  count: number;       // Number of generations today
  updatedAt: Timestamp; // Last increment timestamp
}
```

### Client-Side Auth State

```typescript
interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  tier: "free" | "pro" | null;
  usageCount: number;       // Today's generation count
  remainingCount: number;   // DAILY_LIMIT - usageCount
}
```

## Components and Interfaces

### File Structure (New Files)

```
app/
├── page.tsx                          (modified — conditionally renders auth vs generation)
├── layout.tsx                        (modified — wraps children in AuthProvider)
├── api/
│   └── generate/
│       └── route.ts                  (modified — adds auth + usage enforcement)
lib/
├── firebase/
│   ├── client.ts                     (Firebase client SDK init)
│   └── admin.ts                      (Firebase Admin SDK init)
├── auth/
│   ├── AuthProvider.tsx              (React context provider)
│   └── useAuth.ts                    (hook exposing auth state + actions)
├── usage/
│   └── tracker.ts                    (server-side usage read/increment)
components/
├── AuthGate.tsx                      (sign-in / register form)
├── AccountIndicator.tsx              (email display + sign-out button)
└── UsageCounter.tsx                  (remaining generations display)
```

## Interfaces

### Firebase Client Initialization

```typescript
// lib/firebase/client.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
```

### Firebase Admin Initialization

```typescript
// lib/firebase/admin.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = getAuth();
export const db = getFirestore();
```

### Auth Provider

```typescript
// lib/auth/AuthProvider.tsx
"use client";

import { createContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  tier: "free" | "pro" | null;
  usageCount: number;
  remainingCount: number;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  tier: null,
  usageCount: 0,
  remainingCount: 5,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<"free" | "pro" | null>(null);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch user profile and today's usage from API
        await fetchUserProfile(firebaseUser);
      } else {
        setTier(null);
        setUsageCount(0);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const remainingCount = tier === "pro" ? Infinity : Math.max(0, 5 - usageCount);

  return (
    <AuthContext.Provider value={{ user, loading, tier, usageCount, remainingCount }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Auth Hook

```typescript
// lib/auth/useAuth.ts
"use client";

import { useContext } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { AuthContext } from "./AuthProvider";

export function useAuth() {
  const context = useContext(AuthContext);

  async function register(email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // Server creates User_Document on first token verification
    return credential.user;
  }

  async function signInEmail(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }

  async function signInGoogle() {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    return credential.user;
  }

  async function logout() {
    await signOut(auth);
  }

  return { ...context, register, signInEmail, signInGoogle, logout };
}
```

### Usage Tracker (Server-Side)

```typescript
// lib/usage/tracker.ts
import { db } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const DAILY_LIMIT = 5;

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD UTC
}

function getUsageDocRef(uid: string, date: string) {
  return db.collection("users").doc(uid).collection("usage").doc(date);
}

function getUserDocRef(uid: string) {
  return db.collection("users").doc(uid);
}

export interface UsageCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
}

export async function checkUsage(uid: string, tier: string): Promise<UsageCheckResult> {
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

export async function ensureUserDocument(uid: string, email: string): Promise<void> {
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
```

### Modified Generate Endpoint

```typescript
// app/api/generate/route.ts (modified)
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { adminAuth } from "@/lib/firebase/admin";
import { checkUsage, incrementUsage, getUserTier, ensureUserDocument } from "@/lib/usage/tracker";

export async function POST(request: Request) {
  // 1. Extract and verify token
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
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email ?? "";
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  // 2. Ensure user document exists
  try {
    await ensureUserDocument(uid, email);
  } catch {
    // Non-blocking — user doc creation failure shouldn't block generation
  }

  // 3. Check usage limit
  let tier: string;
  try {
    tier = await getUserTier(uid);
  } catch {
    return NextResponse.json(
      { error: "Temporary service issue. Please try again." },
      { status: 503 }
    );
  }

  let usageCheck;
  try {
    usageCheck = await checkUsage(uid, tier);
  } catch {
    return NextResponse.json(
      { error: "Temporary service issue. Please try again." },
      { status: 503 }
    );
  }

  if (!usageCheck.allowed) {
    return NextResponse.json(
      { error: "Daily generation limit reached. Try again tomorrow." },
      { status: 429 }
    );
  }

  // 4. Process generation (existing logic)
  const { notes, type, tone } = await request.json();
  // ... existing OpenAI streaming logic ...

  // 5. Increment usage (post-generation, non-blocking on failure)
  try {
    await incrementUsage(uid);
  } catch (err) {
    console.error("Failed to increment usage count:", err);
    // Still deliver content per Requirement 10.2
  }

  // Return streamed response
  // ... existing streaming logic ...
}
```

## Data Flow

### Generation Request Flow

```
Client                          API Route                       Firestore
  │                                │                               │
  │─── POST /api/generate ────────▶│                               │
  │    (Bearer token + body)       │                               │
  │                                │── verifyIdToken(token) ──────▶│ Firebase Auth
  │                                │◀── { uid, email } ───────────│
  │                                │                               │
  │                                │── getUserTier(uid) ──────────▶│ users/{uid}
  │                                │◀── "free" | "pro" ───────────│
  │                                │                               │
  │                                │── checkUsage(uid, tier) ─────▶│ users/{uid}/usage/{date}
  │                                │◀── { allowed, count } ───────│
  │                                │                               │
  │                                │   [if !allowed → 429]         │
  │                                │                               │
  │                                │── OpenAI stream ─────────────▶│ OpenAI
  │◀── streamed content ──────────│◀── chunks ────────────────────│
  │                                │                               │
  │                                │── incrementUsage(uid) ───────▶│ users/{uid}/usage/{date}
  │                                │◀── ack ──────────────────────│
  │                                │                               │
```

### Auth State Flow

```
Browser                         Firebase Auth
  │                                │
  │── createUser / signIn ────────▶│
  │◀── UserCredential ────────────│
  │                                │
  │   onAuthStateChanged fires     │
  │   → AuthProvider updates state │
  │   → UI re-renders             │
  │     (hide auth, show form)     │
```

## Error Handling

| Scenario | HTTP Status | User-Facing Message | Server Action |
|----------|-------------|---------------------|---------------|
| No auth token | 401 | "Authentication required" | Reject request |
| Invalid/expired token | 401 | "Invalid or expired token" | Reject request |
| Firestore read failure | 503 | "Temporary service issue. Please try again." | Reject request, log error |
| Daily limit reached | 429 | "Daily generation limit reached. Try again tomorrow." | Reject request |
| Firestore write failure (post-generation) | — | None (content delivered) | Log error server-side |
| Firebase Auth error (client) | — | Mapped error message (see below) | Display in UI |

### Client-Side Auth Error Mapping

```typescript
function mapAuthError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/network-request-failed":
      return "Connection problem. Please check your network and try again.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}
```

## Environment Variables

```bash
# .env.local

# Firebase Client SDK (NEXT_PUBLIC_ prefix for client access)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (server-only)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Existing
OPENAI_API_KEY=
```

## Dependencies

New packages to install:

```json
{
  "dependencies": {
    "firebase": "^11.0.0",
    "firebase-admin": "^13.0.0"
  }
}
```

## Testing Strategy

### Unit Tests (Example-Based)
- Auth error mapping: verify each Firebase error code maps to the correct user-facing message
- Sign-out clears state and shows sign-in UI
- Unauthenticated state hides the generation form
- Pro-tier users do not see remaining count display
- SPA behavior: auth state transitions don't trigger page navigation

### Integration Tests
- Firebase Auth registration creates account (mock Firebase)
- Google OAuth flow initiates correctly (mock Firebase)
- Sign-in establishes session (mock Firebase)

### Property-Based Tests
- Token validation rejects all invalid tokens (Property 2)
- Usage count increments exactly (Property 3)
- Usage document key format follows spec (Property 4)
- Tier-aware limit enforcement (Property 5)
- Remaining count calculation (Property 6)
- Tier field invariant (Property 7)
- Firestore read failure yields 503 (Property 8)
- Content delivery despite write failure (Property 9)

### Edge Cases (Covered by Property Generators)
- First generation of the day (no existing Usage_Document)
- Exactly at the limit boundary (count = 4 → allowed, count = 5 → denied)
- User signs out during generation stream
- Midnight UTC boundary (date rollover)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: User Document Creation Integrity

*For any* successfully registered user with a valid uid and email, the created User_Document in Firestore SHALL contain the exact uid, the exact email, an account tier of "free", and a non-null creation timestamp.

**Validates: Requirements 1.3**

### Property 2: Authentication Rejection for Invalid Tokens

*For any* request to the Generate_Endpoint that either lacks an Authorization header, has a malformed token, or has an expired token, the response SHALL be HTTP 401 with a JSON error body — regardless of the request body content.

**Validates: Requirements 5.1, 5.2**

### Property 3: Usage Count Increment Exactness

*For any* free-tier user with a current daily usage count of N (where N < Daily_Generation_Limit), after a successful generation request completes, the usage count SHALL be exactly N + 1.

**Validates: Requirements 6.1, 6.3**

### Property 4: Usage Document Key Format

*For any* user ID and any point in time, the Usage_Document SHALL be stored at the path `users/{uid}/usage/{YYYY-MM-DD}` where the date is the current UTC date formatted as an ISO date string.

**Validates: Requirements 6.2**

### Property 5: Tier-Aware Limit Enforcement

*For any* generation request from an authenticated user: if the user's tier is "free" and their daily count is >= Daily_Generation_Limit (5), the response SHALL be HTTP 429; if the user's tier is "pro", the response SHALL proceed regardless of usage count.

**Validates: Requirements 7.1, 7.4, 8.2**

### Property 6: Remaining Count Display Accuracy

*For any* free-tier user with a daily usage count of N (where 0 ≤ N ≤ 5), the displayed remaining generation count SHALL equal exactly (Daily_Generation_Limit - N).

**Validates: Requirements 7.2**

### Property 7: Account Tier Field Invariant

*For any* User_Document in Firestore, the account tier field SHALL have a value that is exactly "free" or "pro" — no other values are permitted.

**Validates: Requirements 8.1**

### Property 8: Graceful Degradation on Firestore Read Failure

*For any* generation request where the Firestore usage read operation throws an error, the Generate_Endpoint SHALL respond with HTTP 503 and a JSON body indicating a temporary service issue — never proceeding with generation.

**Validates: Requirements 10.1**

### Property 9: Content Delivery Despite Write Failure

*For any* generation request that successfully produces AI content but encounters a Firestore write failure during usage increment, the generated content SHALL still be delivered to the client in full.

**Validates: Requirements 10.2**

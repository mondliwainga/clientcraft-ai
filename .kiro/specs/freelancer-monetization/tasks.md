# Implementation Plan: Freelancer Monetization

## Overview

Add Firebase Authentication (email + Google OAuth), Firestore-based daily usage tracking, and free-tier enforcement (5 generations/day) to ClientCraft AI. The existing single-page architecture is preserved — all auth UI, generation form, and results render on the same page driven by client-side state.

## Tasks

- [ ] 1. Install dependencies and set up Firebase SDK configuration
  - [ ] 1.1 Install Firebase packages and create client SDK initialization
    - Install `firebase` and `firebase-admin` packages
    - Create `lib/firebase/client.ts` with Firebase client SDK initialization using `NEXT_PUBLIC_` environment variables
    - Export the `auth` instance from `getAuth()`
    - _Requirements: 9.3_

  - [ ] 1.2 Create Firebase Admin SDK initialization
    - Create `lib/firebase/admin.ts` with Firebase Admin SDK initialization using server-side environment variables
    - Export `adminAuth` (from `getAuth()`) and `db` (from `getFirestore()`)
    - Handle the singleton pattern with `getApps().length` check
    - _Requirements: 5.1, 5.2_

- [ ] 2. Implement Auth Provider and hook
  - [ ] 2.1 Create AuthProvider React context
    - Create `lib/auth/AuthProvider.tsx` as a `"use client"` component
    - Implement `AuthContext` with `user`, `loading`, `tier`, `usageCount`, and `remainingCount` state
    - Subscribe to `onAuthStateChanged` in a `useEffect` to track auth state
    - Fetch user profile and today's usage count when a user authenticates
    - Calculate `remainingCount` as `DAILY_LIMIT - usageCount` (or Infinity for pro tier)
    - _Requirements: 4.3, 7.2, 8.3, 9.2, 9.3_

  - [ ] 2.2 Create useAuth hook with auth actions
    - Create `lib/auth/useAuth.ts` as a `"use client"` module
    - Expose `register(email, password)` using `createUserWithEmailAndPassword`
    - Expose `signInEmail(email, password)` using `signInWithEmailAndPassword`
    - Expose `signInGoogle()` using `signInWithPopup` with `GoogleAuthProvider`
    - Expose `logout()` using `signOut`
    - Include an `mapAuthError(code)` helper that maps Firebase error codes to user-facing messages
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1_

- [ ] 3. Implement server-side usage tracking
  - [ ] 3.1 Create usage tracker module
    - Create `lib/usage/tracker.ts` with the following exported functions:
    - `ensureUserDocument(uid, email)` — creates User_Document with tier "free" and server timestamp if it doesn't exist
    - `getUserTier(uid)` — reads tier field from `users/{uid}`, defaults to "free"
    - `checkUsage(uid, tier)` — returns `{ allowed, currentCount, limit }` based on tier and today's usage count
    - `incrementUsage(uid)` — increments count in `users/{uid}/usage/{YYYY-MM-DD}` using `FieldValue.increment(1)`
    - Use UTC date string (`YYYY-MM-DD`) for usage document keys
    - _Requirements: 1.3, 6.1, 6.2, 6.3, 7.1, 7.4, 8.1, 8.2_

  - [ ]* 3.2 Write property tests for usage tracker
    - **Property 3: Usage Count Increment Exactness** — verify that after incrementUsage, the count is exactly N + 1
    - **Property 4: Usage Document Key Format** — verify document path uses `users/{uid}/usage/{YYYY-MM-DD}` format
    - **Property 5: Tier-Aware Limit Enforcement** — verify free-tier users are blocked at count >= 5, pro-tier users are never blocked
    - **Property 7: Account Tier Field Invariant** — verify tier is always "free" or "pro"
    - **Validates: Requirements 6.1, 6.2, 6.3, 7.1, 7.4, 8.1, 8.2**

- [ ] 4. Modify the Generate API route with auth and usage enforcement
  - [ ] 4.1 Add token verification and usage checks to /api/generate
    - Extract `Authorization: Bearer <token>` header; return 401 if missing
    - Verify token using `adminAuth.verifyIdToken(token)`; return 401 if invalid/expired
    - Call `ensureUserDocument(uid, email)` (non-blocking on failure)
    - Call `getUserTier(uid)`; return 503 if Firestore read fails
    - Call `checkUsage(uid, tier)`; return 503 if Firestore read fails, return 429 if not allowed
    - After successful generation, call `incrementUsage(uid)` — log error but still deliver content on failure
    - Preserve existing OpenAI streaming logic
    - _Requirements: 5.1, 5.2, 5.3, 7.1, 7.4, 8.2, 10.1, 10.2_

  - [ ]* 4.2 Write property tests for Generate API route auth enforcement
    - **Property 2: Authentication Rejection for Invalid Tokens** — verify all requests without valid tokens receive 401
    - **Property 8: Graceful Degradation on Firestore Read Failure** — verify 503 response on Firestore read errors
    - **Property 9: Content Delivery Despite Write Failure** — verify content is delivered even when usage increment fails
    - **Validates: Requirements 5.1, 5.2, 10.1, 10.2**

- [ ] 5. Checkpoint - Ensure server-side logic is solid
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Build authentication UI components
  - [ ] 6.1 Create AuthGate component (sign-in / register form)
    - Create `components/AuthGate.tsx` as a `"use client"` component
    - Implement a tabbed or toggled UI for sign-in vs. registration
    - Include email/password fields with form validation (min 6 chars for password)
    - Include a "Sign in with Google" button
    - Display mapped error messages from Firebase auth errors
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

  - [ ] 6.2 Create AccountIndicator component
    - Create `components/AccountIndicator.tsx` as a `"use client"` component
    - Display the authenticated user's email address
    - Include a sign-out button that calls the `logout()` action from `useAuth`
    - _Requirements: 3.1, 3.2, 4.1_

  - [ ] 6.3 Create UsageCounter component
    - Create `components/UsageCounter.tsx` as a `"use client"` component
    - Display remaining generations for the current UTC day (e.g., "3 of 5 generations remaining")
    - Hide the counter for pro-tier users
    - _Requirements: 7.2, 7.3, 8.3_

- [ ] 7. Integrate auth and usage into the main page
  - [ ] 7.1 Wrap app in AuthProvider
    - Modify `app/layout.tsx` to wrap children in the `AuthProvider` component
    - _Requirements: 9.2, 9.3_

  - [ ] 7.2 Modify page.tsx to conditionally render auth vs generation UI
    - When unauthenticated: show `AuthGate` component, hide generation form
    - When authenticated: show `AccountIndicator`, `UsageCounter`, and the existing generation form
    - Add `Authorization: Bearer <idToken>` header to the `/api/generate` fetch call
    - Disable the Generate button when `remainingCount` is 0 and show limit-reached message
    - All transitions happen client-side without page navigation
    - _Requirements: 4.1, 4.2, 4.3, 5.3, 7.2, 7.3, 9.1, 9.2_

  - [ ]* 7.3 Write property test for remaining count display accuracy
    - **Property 6: Remaining Count Display Accuracy** — verify that for any free-tier user with count N (0 ≤ N ≤ 5), remaining equals exactly (5 - N)
    - **Validates: Requirements 7.2**

- [ ] 8. Checkpoint - Ensure full integration works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. User document creation and first-time user flow
  - [ ] 9.1 Implement user profile and usage fetch on auth state change
    - In `AuthProvider`, when a user authenticates, fetch their tier and today's usage from a new API endpoint (e.g., `/api/user/profile`) or directly via the generate endpoint response headers
    - Create `app/api/user/profile/route.ts` — accepts a Firebase ID token, returns `{ tier, usageCount }` from Firestore
    - Calls `ensureUserDocument` to handle first-time users
    - _Requirements: 1.3, 7.2, 8.3_

  - [ ]* 9.2 Write property test for user document creation
    - **Property 1: User Document Creation Integrity** — verify that for any valid uid and email, the created document contains exact uid, exact email, tier "free", and non-null createdAt
    - **Validates: Requirements 1.3**

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The project uses TypeScript, Next.js 16, React 19, and Tailwind CSS 4
- Firebase client SDK is used on the client; Firebase Admin SDK is used in API routes
- All auth state transitions are client-side (SPA preserved per Requirement 9)
- Usage tracking uses UTC dates for day boundaries

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "6.1", "6.2", "6.3"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["7.2", "9.1"] },
    { "id": 6, "tasks": ["7.3", "9.2"] }
  ]
}
```

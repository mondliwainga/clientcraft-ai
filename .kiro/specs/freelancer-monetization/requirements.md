# Requirements Document

## Introduction

ClientCraft AI is a single-page Next.js application that transforms rough notes into professional client communications using streaming AI generation. This feature adds an MVP monetization layer targeting freelancers: Firebase Authentication (email + Google OAuth), Firestore-based daily usage tracking, and free-tier enforcement (5 generations per day). The existing single-page architecture is preserved. Stripe-based Pro tier billing is deferred to a future spec.

## Glossary

- **ClientCraft_App**: The Next.js 16 single-page application that provides AI-powered content generation for freelancers
- **Auth_Module**: The Firebase Authentication integration layer handling user sign-up, sign-in, and session management
- **Usage_Tracker**: The Firestore-based subsystem that records and queries daily generation counts per user
- **Generate_Endpoint**: The /api/generate Next.js API route that processes generation requests and streams AI responses
- **Free_Tier_User**: An authenticated user who has not upgraded to Pro status (default state for all new users)
- **Daily_Generation_Limit**: The maximum number of AI generations a Free_Tier_User may perform per calendar day (UTC), set to 5
- **Auth_Provider**: Firebase Authentication service supporting email/password and Google OAuth sign-in methods
- **User_Document**: A Firestore document storing user metadata including account tier and creation timestamp
- **Usage_Document**: A Firestore document storing the generation count for a specific user on a specific UTC date

## Requirements

### Requirement 1: User Registration

**User Story:** As a freelancer, I want to create an account with my email or Google account, so that I can access ClientCraft AI and have my usage tracked.

#### Acceptance Criteria

1. WHEN a visitor selects email registration, THE Auth_Module SHALL create a new Firebase Authentication account using the provided email address and password.
2. WHEN a visitor selects Google sign-in, THE Auth_Module SHALL initiate the Google OAuth flow and create or link a Firebase Authentication account upon successful authorization.
3. WHEN registration completes successfully, THE Usage_Tracker SHALL create a User_Document in Firestore with the user ID, email, account tier set to "free", and creation timestamp.
4. IF registration fails due to an already-existing email, THEN THE Auth_Module SHALL display an error message indicating the email is already in use.
5. IF registration fails due to a weak password, THEN THE Auth_Module SHALL display an error message indicating the password does not meet minimum strength requirements (at least 6 characters).

### Requirement 2: User Sign-In

**User Story:** As a returning freelancer, I want to sign in with my email or Google account, so that I can resume using ClientCraft AI with my tracked usage.

#### Acceptance Criteria

1. WHEN a user submits valid email and password credentials, THE Auth_Module SHALL authenticate the user and establish a client-side session.
2. WHEN a user selects Google sign-in, THE Auth_Module SHALL authenticate the user via Google OAuth and establish a client-side session.
3. IF sign-in fails due to invalid credentials, THEN THE Auth_Module SHALL display an error message indicating the email or password is incorrect.
4. IF sign-in fails due to a network error, THEN THE Auth_Module SHALL display an error message indicating a connection problem and suggest retrying.

### Requirement 3: User Sign-Out

**User Story:** As an authenticated freelancer, I want to sign out of my account, so that I can secure my session on shared devices.

#### Acceptance Criteria

1. WHEN an authenticated user selects the sign-out action, THE Auth_Module SHALL terminate the Firebase Authentication session and clear client-side auth state.
2. WHEN sign-out completes, THE ClientCraft_App SHALL display the sign-in interface and hide the generation form.

### Requirement 4: Auth State UI

**User Story:** As a freelancer, I want to see my authentication status in the interface, so that I know whether I am signed in and which account is active.

#### Acceptance Criteria

1. WHILE a user is authenticated, THE ClientCraft_App SHALL display an account indicator showing the user email address and a sign-out button.
2. WHILE no user is authenticated, THE ClientCraft_App SHALL display sign-in and registration options instead of the generation form.
3. WHEN the authentication state changes, THE ClientCraft_App SHALL update the displayed UI within the same page without a full page navigation.

### Requirement 5: Generation Access Control

**User Story:** As a product owner, I want only authenticated users to access the AI generation feature, so that usage can be tracked and limited per account.

#### Acceptance Criteria

1. WHEN the Generate_Endpoint receives a request without a valid Firebase ID token, THE Generate_Endpoint SHALL respond with HTTP status 401 and a JSON body containing an error message indicating authentication is required.
2. WHEN the Generate_Endpoint receives a request with an expired or malformed Firebase ID token, THE Generate_Endpoint SHALL respond with HTTP status 401 and a JSON body containing an error message indicating the token is invalid.
3. THE Generate_Endpoint SHALL extract the user ID from the verified Firebase ID token for use in usage tracking.

### Requirement 6: Daily Usage Tracking

**User Story:** As a product owner, I want each generation request to be counted per user per day, so that free-tier limits can be enforced accurately.

#### Acceptance Criteria

1. WHEN the Generate_Endpoint processes a valid authenticated request, THE Usage_Tracker SHALL increment the generation count in the Usage_Document for the authenticated user and the current UTC date.
2. THE Usage_Tracker SHALL store each Usage_Document keyed by user ID and UTC date string (YYYY-MM-DD format).
3. WHEN a Usage_Document does not exist for the current user and date, THE Usage_Tracker SHALL create a new Usage_Document with a generation count of 1.

### Requirement 7: Free Tier Limit Enforcement

**User Story:** As a freelancer on the free tier, I want to know how many generations I have remaining today, so that I can use them wisely.

#### Acceptance Criteria

1. WHEN a Free_Tier_User submits a generation request and the daily generation count has reached the Daily_Generation_Limit, THE Generate_Endpoint SHALL respond with HTTP status 429 and a JSON body containing an error message indicating the daily limit has been reached.
2. WHILE a Free_Tier_User is authenticated, THE ClientCraft_App SHALL display the remaining generation count for the current UTC day (Daily_Generation_Limit minus current usage count).
3. WHEN a Free_Tier_User has reached the Daily_Generation_Limit, THE ClientCraft_App SHALL disable the generate button and display a message indicating the daily limit has been reached.
4. THE Generate_Endpoint SHALL check the usage count before processing the generation request to prevent exceeding the Daily_Generation_Limit.

### Requirement 8: Pro Tier Foundation

**User Story:** As a product owner, I want the user data model to support a Pro tier designation, so that Stripe billing integration can be added in a future iteration without schema migration.

#### Acceptance Criteria

1. THE Usage_Tracker SHALL store an account tier field in each User_Document with a value of "free" or "pro".
2. WHILE a user has an account tier of "pro" in the User_Document, THE Generate_Endpoint SHALL skip the daily generation limit check and process the request without restriction.
3. THE ClientCraft_App SHALL omit the remaining generation count display for users with an account tier of "pro".

### Requirement 9: Single-Page Architecture Preservation

**User Story:** As a freelancer, I want the app to remain a fast single-page experience, so that adding authentication does not degrade the existing workflow.

#### Acceptance Criteria

1. THE ClientCraft_App SHALL render authentication UI, generation form, and results within a single page without introducing additional route pages.
2. WHEN the authentication state transitions between signed-in and signed-out, THE ClientCraft_App SHALL update the UI via client-side state changes without triggering a full page reload.
3. THE Auth_Module SHALL initialize Firebase on the client side and manage auth state via the Firebase client SDK onAuthStateChanged listener.

### Requirement 10: Error Handling for Usage Tracking Failures

**User Story:** As a freelancer, I want my generation requests to still work if usage tracking encounters a transient error, so that temporary Firestore issues do not block my workflow.

#### Acceptance Criteria

1. IF the Usage_Tracker fails to read the current usage count due to a Firestore error, THEN THE Generate_Endpoint SHALL deny the generation request and respond with HTTP status 503 and a JSON body indicating a temporary service issue.
2. IF the Usage_Tracker fails to increment the usage count after a successful generation, THEN THE Generate_Endpoint SHALL log the error server-side but still deliver the generated content to the user.

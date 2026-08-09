# ClientCraft AI

AI-powered business document generator built for freelancers and small business owners. Paste rough notes or upload a voice recording, and get polished, ready-to-use professional documents in seconds.

🔗 **Live:** [clientcraft-ai.vercel.app](https://clientcraft-ai.vercel.app)

## Features

- **8 Document Types** — Email, Proposal, Invoice, Quotation, Contract, Business Plan, Social Media Post, Follow-up
- **6 Tone Options** — Professional, Friendly, Formal, Persuasive, Confident, Casual
- **Voice-to-Document** — Upload audio recordings that get transcribed and converted into polished documents
- **Download** — Export as PDF, Word (.docx), or plain text
- **Streaming AI** — Real-time text generation with GPT-4o-mini
- **Smart Prompting** — Asks clarifying questions when details are missing before generating
- **Auth** — Sign in with email or Google
- **Freemium** — 5 free generations/day, unlimited for Pro users
- **Dark Mode** — Toggle between light and dark themes
- **Admin Dashboard** — Track users, daily activity, and limit hits

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **AI:** OpenAI GPT-4o-mini (generation) + Whisper (transcription)
- **Auth & DB:** Firebase Auth + Cloud Firestore
- **Hosting:** Vercel

## Getting Started

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` with your keys:
   ```
   OPENAI_API_KEY=
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   FIREBASE_PROJECT_ID=
   FIREBASE_CLIENT_EMAIL=
   FIREBASE_PRIVATE_KEY=
   ADMIN_SECRET=
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

## License

MIT

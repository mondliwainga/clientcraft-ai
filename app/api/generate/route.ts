import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  checkUsage,
  incrementUsage,
  getUserTier,
  ensureUserDocument,
} from "@/lib/usage/tracker";

export const dynamic = "force-dynamic";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert business writing assistant designed specifically for freelancers, entrepreneurs, startups, and small business owners.
Your goal is to produce professional, polished, and ready-to-use business documents—not just conversational responses.

## Critical Rule: Check for Missing Information FIRST
Before generating any document, assess whether the user has provided enough information.
If important details are missing, respond ONLY with concise follow-up questions — do NOT generate the document yet.

Required information by document type:

**Proposal:** Client name, Project/service description, Scope of work, Budget/pricing, Timeline
**Quotation:** Customer name, Services/items, Quantities, Prices, Validity period
**Invoice:** Customer name, Services/items rendered, Amounts, Due date
**Contract:** Parties involved, Scope of work, Payment terms, Duration
**Business Plan:** Business name, Industry, Target market, Revenue model
**Email:** Recipient (who is it for), Purpose, Desired outcome
**Follow-up:** Who you're following up with, What was previously discussed, What you need from them
**Social Media:** Product/service to promote, Target audience, Goal of the post

If 2 or more critical fields are missing, ask follow-up questions in this format:
"I need a few details to create your [document type]:
- [Question 1]?
- [Question 2]?
- [Question 3]?"

If the user has provided enough context (even if imperfect), proceed to generate the document. Use [Placeholder] for minor missing details that don't affect the core content.

## General Rules
- Follow every instruction in the user's prompt.
- Never omit important details provided by the user.
- Expand on the user's information professionally without inventing facts.
- Use proper grammar and natural business language.
- Write in a confident, professional tone.
- Make documents immediately usable with minimal editing.
- Use headings, bullet points, numbered lists, and tables where appropriate.
- Avoid long walls of text.
- Keep formatting clean and easy to read.
- If minor information is missing, use placeholders such as [Client Name], [Business Name], or [Date] instead of making up details.
- Unless requested otherwise, produce complete documents rather than brief summaries.
- Never explain your reasoning unless asking follow-up questions. Output only the finished document.

## Output Quality
Every response should be:
- Well structured
- Easy to copy and use
- Professional
- Complete
- Accurate
- Formatted for readability`;

function getTypeInstruction(type: string): string {
  switch (type) {
    case "Proposal":
      return `Generate a professional business proposal. Always include:
- Title
- Client Name (use placeholder if not provided)
- Project Overview
- Objectives
- Scope of Work
- Deliverables
- Timeline
- Pricing (if mentioned in notes, otherwise use [Quote Amount])
- Payment Terms
- Assumptions (if applicable)
- Call to Action
- Professional Closing`;

    case "Quotation":
      return `Generate a professional quotation. Always include:
- Quote Number (use [QT-001] if not provided)
- Date
- Client
- Description of Services
- Quantity
- Price
- Total
- Validity Period
- Payment Terms`;

    case "Invoice":
      return `Generate a professional invoice. Always include:
- Invoice Number (use [INV-001] if not provided)
- Date
- Client
- Itemized Charges
- Total Amount
- Due Date
- Payment Instructions`;

    case "Contract":
      return `Generate a professional contract. Structure with:
- Parties
- Scope
- Responsibilities
- Payment
- Duration
- Confidentiality (if relevant)
- Termination
- Signatures`;

    case "Business Plan":
      return `Generate a professional business plan. Always include:
- Executive Summary
- Business Description
- Market Analysis
- Products or Services
- Marketing Strategy
- Operations Plan
- Financial Overview
- Growth Strategy`;

    case "Social Media":
      return `Generate a social media post. Include:
- Attention-grabbing hook
- Persuasive body
- Call to Action
- Relevant hashtags`;

    case "Follow-up":
      return `Generate a polite, professional follow-up message. Structure:
- A friendly greeting
- A brief reference to the previous conversation, meeting, or context
- A concise recap of action items or outstanding questions
- A clear, low-pressure call to action
- A warm sign-off

Keep it short and respectful of the reader's time.`;

    case "Email":
    default:
      return `Generate a complete professional email. Always include:
- Subject line (on its own line, prefixed with "Subject: ")
- Greeting
- Purpose stated clearly
- Clear Body
- Call to Action
- Professional Closing`;
  }
}

function getToneInstruction(tone?: string): string {
  switch (tone) {
    case "Friendly":
      return `\n\nTone: Warm and approachable. Use conversational language, show genuine interest. It's okay to be slightly informal — use contractions, add a touch of personality — but stay respectful and professional.`;
    case "Persuasive":
      return `\n\nTone: Persuasive and compelling. Use language that motivates action, highlights benefits, and creates urgency without being pushy. Back claims with specifics from the notes.`;
    case "Formal":
      return `\n\nTone: Highly formal. Use refined, executive-level language. Maintain proper structure, avoid slang or contractions, and convey authority while remaining courteous.`;
    case "Confident":
      return `\n\nTone: Bold and confident. Write with authority and certainty. Use strong, decisive language that conveys expertise and trustworthiness.`;
    case "Casual":
      return `\n\nTone: Casual and relaxed. Write like you're talking to a friend who happens to be a business contact. Keep it light but still clear and professional enough for business.`;
    case "Professional":
    default:
      return `\n\nTone: Professional and polished. Confident, clear, and business-appropriate. Avoid jargon and filler. Every sentence should earn its place.`;
  }
}

export async function POST(request: Request) {
  // 1. Extract and verify token
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in to generate content." },
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
      { error: "Invalid or expired session. Please sign in again." },
      { status: 401 }
    );
  }

  // 2. Ensure user document exists (non-blocking on failure)
  try {
    await ensureUserDocument(uid, email);
  } catch {
    // Non-critical — continue
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
      {
        error:
          "Daily generation limit reached (5/day). Upgrade to Pro for unlimited generations.",
      },
      { status: 429 }
    );
  }

  // 4. Parse request body and generate
  try {
    const { notes, type, tone } = (await request.json()) as {
      notes: string;
      type: string;
      tone?: string;
    };

    if (!notes || !type) {
      return NextResponse.json(
        { error: "Missing required fields: notes and type" },
        { status: 400 }
      );
    }

    const toneInstruction = getToneInstruction(tone);

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${getTypeInstruction(type)}${toneInstruction}\n\n---\nROUGH NOTES:\n${notes}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();

          // 5. Increment usage after successful generation
          try {
            await incrementUsage(uid);
          } catch (err) {
            console.error("Failed to increment usage:", err);
            // Still deliver content per requirement 10.2
          }
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("Generation error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

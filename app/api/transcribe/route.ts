import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAdminAuth } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  try {
    await getAdminAuth().verifyIdToken(token);
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }

  // 2. Get the uploaded file
  const formData = await request.formData();
  const file = formData.get("audio") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "No audio file provided" },
      { status: 400 }
    );
  }

  // 3. Transcribe with Whisper
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error: unknown) {
    console.error("Transcription error:", error);
    const message =
      error instanceof Error ? error.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { AuthGate } from "@/components/AuthGate";
import { AccountIndicator } from "@/components/AccountIndicator";
import { UsageCounter } from "@/components/UsageCounter";
import { downloadAsTxt, downloadAsPdf, downloadAsDocx } from "@/lib/download";

export default function Dashboard() {
  const { user, loading, remainingCount, refreshUsage } = useAuth();

  const [notes, setNotes] = useState("");
  const [outputType, setOutputType] = useState("email");
  const [tone, setTone] = useState("Professional");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recording, setRecording] = useState(false);
  const resultRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function handleUpgrade() {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setError(data.error || "Failed to start upgrade process");
      }
    } catch {
      setError("Failed to connect to payment service");
    }
  }

  const typeLabel =
    outputType === "email"
      ? "Email"
      : outputType === "proposal"
        ? "Proposal"
        : outputType === "quotation"
          ? "Quotation"
          : outputType === "invoice"
            ? "Invoice"
            : outputType === "contract"
              ? "Contract"
              : outputType === "business-plan"
                ? "Business Plan"
                : outputType === "social-media"
                  ? "Social Media"
                  : "Follow-up";

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const isAtLimit = remainingCount === 0;

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.style.height = "auto";
      resultRef.current.style.height = resultRef.current.scrollHeight + "px";
    }
  }, [result]);

  const handleGenerate = useCallback(async () => {
    if (!notes.trim() || !user) return;
    setGenerating(true);
    setResult("");
    setError(null);
    setCopied(false);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes, type: typeLabel, tone }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setError("Failed to read response stream.");
        return;
      }

      const decoder = new TextDecoder();
      let done = false;
      let fullText = "";

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          const text = decoder.decode(value, { stream: true });
          fullText += text;
          setResult((prev) => prev + text);
        }
      }

      const looksLikeQuestions =
        fullText.includes("I need a few details") ||
        fullText.includes("I need some details") ||
        fullText.includes("Could you provide") ||
        fullText.includes("Please provide") ||
        (fullText.split("?").length >= 3 && fullText.length < 500);

      if (looksLikeQuestions) {
        setIsFollowUp(true);
      } else {
        setIsFollowUp(false);
        await refreshUsage();
      }
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [notes, typeLabel, tone, user, refreshUsage]);

  function handleClear() {
    setNotes("");
    setOutputType("email");
    setTone("Professional");
    setResult("");
    setError(null);
    setCopied(false);
    setIsFollowUp(false);
  }

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setTranscribing(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("audio", file);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Transcription failed");
        return;
      }
      setNotes((prev) => (prev ? prev + "\n\n" + data.text : data.text));
    } catch {
      setError("Failed to transcribe audio. Please try again.");
    } finally {
      setTranscribing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "recording.webm", { type: "audio/webm" });

        if (!user) return;
        setTranscribing(true);
        setError(null);

        try {
          const token = await user.getIdToken();
          const formData = new FormData();
          formData.append("audio", file);

          const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "Transcription failed");
            return;
          }
          setNotes((prev) => (prev ? prev + "\n\n" + data.text : data.text));
        } catch {
          setError("Failed to transcribe recording. Please try again.");
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="flex items-center gap-3">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#8B5CF6]/30 border-t-blue-600" />
          <span className="text-gray-500">Loading...</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 text-center">Sign in to ClientCraft AI</h1>
          <p className="mt-2 text-center text-sm text-gray-500">Create your account or sign in to start generating documents.</p>
          <div className="mt-6">
            <AuthGate darkMode={false} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`flex-1 flex items-center justify-center px-4 py-12 transition-colors duration-300 ${
        darkMode ? "bg-[#13111C]" : "bg-gray-50"
      }`}
    >
      <div
        className={`w-full max-w-xl rounded-2xl p-8 shadow-lg transition-colors duration-300 ${
          darkMode
            ? "bg-[#1C1A27] ring-1 ring-[#2D2A3A]"
            : "bg-white ring-1 ring-gray-100"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <h1
            className={`text-3xl font-bold tracking-tight text-center flex-1 whitespace-nowrap ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            ClientCraft AI
          </h1>
          <div className="flex-1 flex justify-end">
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`rounded-full p-2 transition ${
                darkMode
                  ? "bg-[#252336] text-[#A78BFA] hover:bg-gray-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <p className={`mt-2 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Professional emails, proposals, invoices &amp; more — in seconds
        </p>

        {/* Account & Usage */}
        <div className="mt-6 space-y-3">
          <AccountIndicator darkMode={darkMode} />
          <UsageCounter darkMode={darkMode} onUpgrade={handleUpgrade} />
        </div>

        {/* Form */}
        <div className="mt-6 space-y-4">
          <div>
            <textarea
              rows={6}
              placeholder="Paste your rough notes or voice transcript here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full resize-none rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] ${
                darkMode
                  ? "border-[#2D2A3A] bg-[#252336] text-gray-100 placeholder-gray-500"
                  : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400"
              }`}
            />
            <div className={`mt-1 flex items-center justify-between text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.mp4" onChange={handleFileUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={transcribing || recording}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 transition ${
                    darkMode ? "bg-[#252336] text-gray-300 ring-[#2D2A3A] hover:bg-gray-600" : "bg-white text-gray-600 ring-gray-200 hover:bg-gray-50"
                  } disabled:opacity-60`}
                >
                  {transcribing ? (
                    <><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />Transcribing...</>
                  ) : (
                    <><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>Upload</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  disabled={transcribing}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 transition ${
                    recording
                      ? "bg-red-600 text-white ring-red-600 hover:bg-red-700 animate-pulse"
                      : darkMode
                        ? "bg-[#252336] text-gray-300 ring-[#2D2A3A] hover:bg-gray-600"
                        : "bg-white text-gray-600 ring-gray-200 hover:bg-gray-50"
                  } disabled:opacity-60`}
                >
                  {recording ? (
                    <><span className="inline-block h-2 w-2 rounded-full bg-white" />Stop</>
                  ) : (
                    <><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>Record</>
                  )}
                </button>
              </div>
              <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select value={outputType} onChange={(e) => setOutputType(e.target.value)} className={`rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] ${darkMode ? "border-[#2D2A3A] bg-[#252336] text-gray-100" : "border-gray-200 bg-gray-50 text-gray-900"}`}>
              <option value="email">Email</option>
              <option value="proposal">Proposal</option>
              <option value="quotation">Quotation</option>
              <option value="invoice">Invoice</option>
              <option value="contract">Contract</option>
              <option value="business-plan">Business Plan</option>
              <option value="social-media">Social Media</option>
              <option value="follow-up">Follow-up</option>
            </select>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className={`rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] ${darkMode ? "border-[#2D2A3A] bg-[#252336] text-gray-100" : "border-gray-200 bg-gray-50 text-gray-900"}`}>
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Formal">Formal</option>
              <option value="Persuasive">Persuasive</option>
              <option value="Confident">Confident</option>
              <option value="Casual">Casual</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button type="button" disabled={generating || !notes.trim() || isAtLimit} onClick={handleGenerate} className="flex-1 rounded-xl bg-[#8B5CF6] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8B5CF6]-hover focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2">
              {generating && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {generating ? "Generating..." : "Generate"}
            </button>
            <button type="button" onClick={handleClear} className={`rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:ring-offset-2 ${darkMode ? "border-[#2D2A3A] bg-[#252336] text-gray-300 hover:bg-gray-600" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>
              Clear
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in">{error}</div>
        )}

        {/* Result */}
        {(result || generating) && (
          <div className={`mt-8 rounded-xl border p-6 animate-fade-in transition-colors ${darkMode ? "border-[#2D2A3A] bg-[#13111C]/50" : "border-gray-200 bg-gray-50"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                {isFollowUp ? "A few more details needed:" : `Here\u0027s your polished ${typeLabel}:`}
              </h2>
              <div className="flex items-center gap-2">
                {!generating && result && !isFollowUp && (
                  <button type="button" onClick={handleGenerate} className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium shadow-sm ring-1 transition ${darkMode ? "bg-[#252336] text-gray-300 ring-[#2D2A3A] hover:bg-gray-600" : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-100"}`}>Regenerate</button>
                )}
                {!isFollowUp && (
                  <button type="button" onClick={handleCopy} disabled={!result} className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium shadow-sm ring-1 transition ${darkMode ? "bg-[#252336] text-gray-300 ring-[#2D2A3A] hover:bg-gray-600" : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-100"} disabled:opacity-50`}>{copied ? "Copied!" : "Copy"}</button>
                )}
              </div>
            </div>
            <textarea
              ref={resultRef}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className={`w-full resize-none rounded-xl border-0 bg-transparent text-sm leading-relaxed focus:outline-none focus:ring-0 font-[family-name:var(--font-geist-sans)] ${darkMode ? "text-gray-100" : "text-gray-900"}`}
              rows={4}
              placeholder={generating ? "Generating..." : ""}
              readOnly={generating}
            />
            {isFollowUp && !generating && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2D2A3A]">
                <p className={`text-xs mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Add the requested details to your notes above, then click Generate again.</p>
              </div>
            )}
            {!isFollowUp && !generating && result && (
              <div className={`mt-4 pt-4 border-t flex items-center gap-2 ${darkMode ? "border-[#2D2A3A]" : "border-gray-200"}`}>
                <span className={`text-xs mr-auto ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Download as:</span>
                <button type="button" onClick={() => downloadAsTxt(result, `clientcraft-${typeLabel.toLowerCase()}`)} className={`rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 transition ${darkMode ? "bg-[#252336] text-gray-300 ring-[#2D2A3A] hover:bg-gray-600" : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-100"}`}>.txt</button>
                <button type="button" onClick={() => downloadAsPdf(result, `clientcraft-${typeLabel.toLowerCase()}`)} className={`rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 transition ${darkMode ? "bg-[#252336] text-gray-300 ring-[#2D2A3A] hover:bg-gray-600" : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-100"}`}>.pdf</button>
                <button type="button" onClick={() => downloadAsDocx(result, `clientcraft-${typeLabel.toLowerCase()}`)} className={`rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 transition ${darkMode ? "bg-[#252336] text-gray-300 ring-[#2D2A3A] hover:bg-gray-600" : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-100"}`}>.docx</button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

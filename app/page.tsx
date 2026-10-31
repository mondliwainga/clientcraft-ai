"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [lightMode, setLightMode] = useState(false);

  // Colors based on theme
  const bg = lightMode ? "bg-[#F8FAFC]" : "bg-[#13111C]";
  const cardBg = lightMode ? "bg-white" : "bg-[#1C1A27]";
  const border = lightMode ? "border-[#E2E8F0]" : "border-[#2D2A3A]";
  const heading = lightMode ? "text-[#0F172A]" : "text-[#E8E4F0]";
  const body = lightMode ? "text-[#64748B]" : "text-[#9B95A8]";
  const muted = lightMode ? "text-[#94A3B8]" : "text-[#6B6580]";
  const navBg = lightMode ? "bg-white/90" : "bg-[#13111C]/90";
  const inputBg = lightMode ? "bg-[#F8FAFC]" : "bg-[#252336]";

  return (
    <div className={`${bg} transition-colors duration-300`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md border-b ${border} ${navBg}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className={`text-xl font-bold ${heading}`}>Client<span className="text-[#8B5CF6]">Craft</span></span>
          <div className={`hidden md:flex items-center gap-8 text-sm ${body}`}>
            <a href="#services" className="hover:text-[#8B5CF6] transition">Services</a>
            <a href="#features" className="hover:text-[#8B5CF6] transition">Features</a>
            <a href="#how-it-works" className="hover:text-[#8B5CF6] transition">How It Works</a>
            <a href="#pricing" className="hover:text-[#8B5CF6] transition">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLightMode(!lightMode)}
              className={`rounded-lg p-2 transition ${lightMode ? "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]" : "bg-[#252336] text-[#A78BFA] hover:bg-[#2D2A3A]"}`}
              aria-label="Toggle theme"
            >
              {lightMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
              )}
            </button>
            {!loading && user ? (
              <Link href="/dashboard" className="rounded-lg bg-[#8B5CF6] px-4 py-2 text-sm font-medium text-white hover:bg-[#7C3AED] transition">Open App</Link>
            ) : (
              <>
                <Link href="/dashboard" className={`text-sm hidden sm:block transition ${body} hover:text-[#8B5CF6]`}>Sign In</Link>
                <Link href="/dashboard" className="rounded-lg bg-[#8B5CF6] px-4 py-2 text-sm font-medium text-white hover:bg-[#7C3AED] transition">Start Creating</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight ${heading}`}>
            Turn Rough Ideas Into<br />Professional Documents
          </h1>
          <p className={`mt-5 text-lg sm:text-xl max-w-2xl mx-auto ${body}`}>
            Just type it. Say it. ClientCraft makes it professional.
          </p>
          <p className={`mt-3 text-base max-w-2xl mx-auto ${muted}`}>
            Create polished emails, proposals, quotations, invoices, contracts, business plans and social media content from simple notes or voice recordings.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto rounded-xl bg-[#8B5CF6] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/20 hover:bg-[#7C3AED] transition">
              Start Creating for Free
            </Link>
            <a href="#how-it-works" className={`w-full sm:w-auto rounded-xl border px-8 py-3.5 text-sm font-semibold transition ${border} ${heading} hover:bg-[#252336]`}>
              See How It Works
            </a>
          </div>
          <p className={`mt-4 text-xs ${muted}`}>5 free documents every day · No credit card required</p>

          {/* Feature badges */}
          <div className={`mt-12 flex flex-wrap items-center justify-center gap-6 text-sm ${body}`}>
            <span className="flex items-center gap-2"><span className="text-[#A78BFA]">🎙️</span> Voice-to-Document</span>
            <span className="flex items-center gap-2"><span className="text-[#8B5CF6]">✨</span> AI-Powered</span>
            <span className="flex items-center gap-2"><span className="text-[#8B5CF6]">📄</span> PDF &amp; Word Export</span>
          </div>

          {/* Product Preview */}
          <div className={`mt-16 rounded-2xl border p-6 sm:p-8 max-w-2xl mx-auto ${border} ${cardBg}`}>
            <div className="space-y-3">
              <div className={`rounded-xl border p-4 ${border} ${inputBg}`}>
                <p className={`text-xs mb-1 font-medium ${muted}`}>Input:</p>
                <p className={`text-sm italic ${body}`}>&quot;Need quote for Thabo. Three bedroom house. Deep clean. Kitchen and bathrooms. Windows. Saturday. R2500.&quot;</p>
              </div>
              <div className="flex items-center justify-center"><span className="text-[#8B5CF6] text-lg">↓</span></div>
              <div className={`rounded-xl border p-4 ${border} ${inputBg}`}>
                <p className={`text-xs mb-2 font-medium ${muted}`}>Generated Quotation:</p>
                <div className={`text-sm space-y-1 ${heading}`}>
                  <p className="font-bold">PROFESSIONAL CLEANING QUOTATION</p>
                  <p className={body}>Prepared for: Thabo</p>
                  <p className={body}>Service: Deep House Cleaning · 3-bedroom residence</p>
                  <p className={`mt-2 font-medium ${heading}`}>Services: Kitchen · Bathrooms · Windows</p>
                  <p className={`mt-2 font-bold ${heading}`}>Total: R2,500 · Scheduled: Saturday</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className={`py-24 ${lightMode ? "bg-white" : "bg-[#1C1A27]/50"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl sm:text-4xl font-bold text-center ${heading}`}>What We Offer</h2>
          <p className={`mt-3 text-center max-w-2xl mx-auto ${body}`}>Everything you need to handle your business writing — fast, professional, and effortless.</p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "✨", title: "AI Document Generation", desc: "Turn rough notes, bullet points, or ideas into polished, ready-to-send business documents in seconds." },
              { icon: "🎙️", title: "Voice-to-Document", desc: "Upload a voice recording or record directly — we transcribe and transform it into a professional document." },
              { icon: "📄", title: "Multi-Format Export", desc: "Download your documents as PDF, Word (.docx), or plain text. Ready for clients immediately." },
              { icon: "🎨", title: "Tone Customization", desc: "Match the writing style to your audience — Professional, Friendly, Formal, Persuasive, Confident, or Casual." },
              { icon: "💬", title: "Smart Follow-Up Questions", desc: "Not sure what details to include? ClientCraft asks the right questions before generating your document." },
              { icon: "⚡", title: "Real-Time Streaming", desc: "Watch your document generate live — no waiting for a loading screen. Edit it as soon as it appears." },
            ].map((item) => (
              <div key={item.title} className={`rounded-2xl border p-6 transition hover:border-[#8B5CF6]/40 ${border} ${cardBg}`}>
                <span className="text-2xl">{item.icon}</span>
                <h3 className={`mt-3 font-semibold ${heading}`}>{item.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${body}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={`py-24 ${lightMode ? "bg-white" : "bg-[#1C1A27]/50"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl sm:text-4xl font-bold text-center ${heading}`}>From Thought to Finished Document in Seconds</h2>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { n: "1", title: "Tell us what you need", desc: "Type rough notes or upload a voice recording." },
              { n: "2", title: "Choose your document", desc: "Email, proposal, quotation, invoice, contract, or more." },
              { n: "3", title: "Set your tone", desc: "Professional, Friendly, Formal, Persuasive, Confident, Casual." },
              { n: "4", title: "Edit, download & send", desc: "Download as PDF, Word, or TXT." },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center mx-auto text-lg font-bold">{s.n}</div>
                <h3 className={`mt-4 font-semibold ${heading}`}>{s.title}</h3>
                <p className={`mt-2 text-sm ${body}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intelligent Follow-up */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className={`text-3xl sm:text-4xl font-bold ${heading}`}>Don&apos;t Know What Details You Need? We Do.</h2>
            <p className={`mt-4 ${body}`}>Just tell ClientCraft what you need. We ask the right questions.</p>
          </div>
          <div className="mt-12 max-w-lg mx-auto space-y-4">
            <div className={`rounded-xl p-4 border ${lightMode ? "bg-[#8B5CF6]/5 border-[#8B5CF6]/20" : "bg-[#8B5CF6]/10 border-[#8B5CF6]/20"}`}>
              <p className="text-xs font-medium text-[#8B5CF6] mb-1">You:</p>
              <p className={`text-sm ${heading}`}>&quot;I need a quotation for painting a three-bedroom house.&quot;</p>
            </div>
            <div className={`rounded-xl border p-4 ${border} ${cardBg}`}>
              <p className={`text-xs font-medium mb-1 ${muted}`}>ClientCraft:</p>
              <p className={`text-sm ${heading}`}>&quot;A few details will help:</p>
              <ul className={`text-sm mt-1 ml-4 list-disc ${body}`}>
                <li>What&apos;s the client&apos;s name?</li>
                <li>What areas need to be painted?</li>
                <li>Do you have a price in mind?&quot;</li>
              </ul>
            </div>
            <div className={`rounded-xl p-4 text-center border ${lightMode ? "bg-green-50 border-green-200" : "bg-[#34D399]/10 border-[#34D399]/20"}`}>
              <p className={`text-sm font-medium ${lightMode ? "text-green-700" : "text-[#34D399]"}`}>✓ Professional quotation generated</p>
            </div>
          </div>
          <p className={`mt-8 text-center text-sm font-medium ${body}`}>No complicated prompts. No blank page. Just tell us what you need.</p>
        </div>
      </section>

      {/* Voice-to-Document */}
      <section className={`py-24 ${lightMode ? "bg-white" : "bg-[#1C1A27]/50"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className={`text-3xl sm:text-4xl font-bold ${heading}`}>Too Busy to Type? Just Talk.</h2>
            <p className={`mt-4 ${body}`}>Upload a voice note or record directly. We transcribe and generate your document.</p>
          </div>
          <div className="mt-12 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            {[
              { icon: "🎙️", label: "Voice Note" },
              { icon: "📝", label: "Transcription" },
              { icon: "✨", label: "ClientCraft AI" },
              { icon: "📄", label: "Document" },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center gap-3 sm:gap-4">
                <div className={`flex flex-col items-center gap-2 rounded-xl border px-5 py-4 ${border} ${cardBg}`}>
                  <span className="text-2xl">{item.icon}</span>
                  <span className={`text-xs font-medium ${body}`}>{item.label}</span>
                </div>
                {i < 3 && <span className="text-[#8B5CF6] text-xl">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Document Types */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl sm:text-4xl font-bold text-center ${heading}`}>One Tool. Your Entire Business Desk.</h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "📧", title: "Emails", desc: "Communicate professionally." },
              { icon: "📋", title: "Proposals", desc: "Win clients with polished proposals." },
              { icon: "💰", title: "Quotations", desc: "Quote jobs faster." },
              { icon: "🧾", title: "Invoices", desc: "Professional invoices." },
              { icon: "📑", title: "Contracts", desc: "Structured agreements." },
              { icon: "📊", title: "Business Plans", desc: "Ideas into plans." },
              { icon: "📱", title: "Social Media", desc: "Content faster." },
            ].map((item) => (
              <div key={item.title} className={`rounded-2xl border p-6 transition hover:border-[#8B5CF6]/40 ${border} ${cardBg}`}>
                <span className="text-2xl">{item.icon}</span>
                <h3 className={`mt-3 font-semibold ${heading}`}>{item.title}</h3>
                <p className={`mt-1 text-sm ${body}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className={`py-24 ${lightMode ? "bg-white" : "bg-[#1C1A27]/50"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl sm:text-4xl font-bold text-center ${heading}`}>Built for People Who Run Businesses</h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: "Cleaning Businesses", desc: "Quotations without hours of writing." },
              { title: "Freelancers", desc: "Proposals, emails, contracts, invoices." },
              { title: "Contractors", desc: "Voice notes into professional quotes." },
              { title: "Small Business Owners", desc: "Business communication faster." },
              { title: "Creatives", desc: "Proposals and social media content." },
            ].map((item) => (
              <div key={item.title} className={`rounded-2xl border p-6 ${border} ${cardBg}`}>
                <h3 className={`font-semibold ${heading}`}>{item.title}</h3>
                <p className={`mt-2 text-sm ${body}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl sm:text-4xl font-bold text-center ${heading}`}>Simple Pricing</h2>
          <p className={`mt-3 text-center ${body}`}>Start free. Upgrade when you need more.</p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className={`rounded-2xl border p-8 ${border} ${cardBg}`}>
              <p className={`text-sm font-medium ${muted}`}>Free</p>
              <p className={`mt-2 text-4xl font-bold ${heading}`}>$0</p>
              <ul className={`mt-6 space-y-3 text-sm ${body}`}>
                <li className="flex items-center gap-2"><span className="text-[#34D399]">✓</span> 5 documents every day</li>
                <li className="flex items-center gap-2"><span className="text-[#34D399]">✓</span> All document types</li>
                <li className="flex items-center gap-2"><span className="text-[#34D399]">✓</span> All tones</li>
                <li className="flex items-center gap-2"><span className="text-[#34D399]">✓</span> Voice-to-document</li>
                <li className="flex items-center gap-2"><span className="text-[#34D399]">✓</span> PDF, Word &amp; TXT</li>
              </ul>
              <Link href="/dashboard" className={`mt-8 block w-full rounded-xl border px-4 py-3 text-center text-sm font-semibold transition ${border} ${heading} hover:bg-[#252336]`}>
                Start Free
              </Link>
            </div>
            <div className={`rounded-2xl border-2 border-[#8B5CF6] p-8 relative ${cardBg}`}>
              <span className="absolute -top-3 left-6 bg-[#8B5CF6] text-white text-xs font-medium px-3 py-1 rounded-full">Popular</span>
              <p className="text-sm font-medium text-[#8B5CF6]">Pro</p>
              <p className={`mt-2 text-4xl font-bold ${heading}`}>$9<span className={`text-lg font-normal ${muted}`}>/mo</span></p>
              <ul className={`mt-6 space-y-3 text-sm ${body}`}>
                <li className="flex items-center gap-2"><span className="text-[#34D399]">✓</span> Unlimited documents</li>
                <li className="flex items-center gap-2"><span className="text-[#34D399]">✓</span> All document types</li>
                <li className="flex items-center gap-2"><span className="text-[#34D399]">✓</span> All tones</li>
                <li className="flex items-center gap-2"><span className="text-[#34D399]">✓</span> Voice-to-document</li>
                <li className="flex items-center gap-2"><span className="text-[#34D399]">✓</span> PDF, Word &amp; TXT</li>
                <li className="flex items-center gap-2"><span className="text-[#34D399]">✓</span> Priority support</li>
              </ul>
              <Link href="/dashboard?upgrade=true" className="mt-8 block w-full rounded-xl bg-[#8B5CF6] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#7C3AED] transition">
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`py-24 ${lightMode ? "bg-white" : "bg-[#1C1A27]/50"}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-3xl sm:text-4xl font-bold ${heading}`}>Your Next Document Starts Here</h2>
          <p className={`mt-4 ${body}`}>Stop staring at a blank page. Give ClientCraft your notes or voice recording and get a professional document in seconds.</p>
          <div className="mt-8">
            <Link href="/dashboard" className="rounded-xl bg-[#8B5CF6] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/20 hover:bg-[#7C3AED] transition">
              Create My First Document →
            </Link>
          </div>
          <p className={`mt-4 text-xs ${muted}`}>Free to start · No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-8 ${border}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className={`text-sm ${muted}`}>© 2026 ClientCraft AI</span>
          <div className={`flex items-center gap-6 text-sm ${muted}`}>
            <a href="#services" className="hover:text-[#8B5CF6] transition">Services</a>
            <a href="#features" className="hover:text-[#8B5CF6] transition">Features</a>
            <a href="#pricing" className="hover:text-[#8B5CF6] transition">Pricing</a>
            <Link href="/terms" className="hover:text-[#8B5CF6] transition">Terms</Link>
            <Link href="/refund-policy" className="hover:text-[#8B5CF6] transition">Refund Policy</Link>
            <Link href="/contact" className="hover:text-[#8B5CF6] transition">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

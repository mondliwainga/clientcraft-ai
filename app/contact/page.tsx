import Link from "next/link";

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#13111C] text-[#E8E4F0]">
      <nav className="border-b border-[#2D2A3A] bg-[#13111C]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#E8E4F0]">Client<span className="text-[#8B5CF6]">Craft</span></Link>
          <Link href="/" className="text-sm text-[#9B95A8] hover:text-[#8B5CF6] transition">← Back to Home</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-white">Contact Us</h1>
        <p className="mt-4 text-[#9B95A8]">Have a question, issue, or feedback? We&apos;d love to hear from you.</p>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#2D2A3A] bg-[#1C1A27] p-6">
            <span className="text-2xl">📧</span>
            <h3 className="mt-3 font-semibold text-[#E8E4F0]">Email</h3>
            <p className="mt-2 text-sm text-[#9B95A8]">For general inquiries, support, or billing questions:</p>
            <a href="mailto:mondliwainga@gmail.com" className="mt-3 inline-block text-sm text-[#8B5CF6] hover:underline">mondliwainga@gmail.com</a>
          </div>

          <div className="rounded-2xl border border-[#2D2A3A] bg-[#1C1A27] p-6">
            <span className="text-2xl">⏱️</span>
            <h3 className="mt-3 font-semibold text-[#E8E4F0]">Response Time</h3>
            <p className="mt-2 text-sm text-[#9B95A8]">We typically respond within 24 hours during business days (Monday–Friday).</p>
          </div>

          <div className="rounded-2xl border border-[#2D2A3A] bg-[#1C1A27] p-6">
            <span className="text-2xl">📍</span>
            <h3 className="mt-3 font-semibold text-[#E8E4F0]">Location</h3>
            <p className="mt-2 text-sm text-[#9B95A8]">ClientCraft is based in South Africa.</p>
          </div>

          <div className="rounded-2xl border border-[#2D2A3A] bg-[#1C1A27] p-6">
            <span className="text-2xl">💡</span>
            <h3 className="mt-3 font-semibold text-[#E8E4F0]">Feature Requests</h3>
            <p className="mt-2 text-sm text-[#9B95A8]">Have an idea for a new document type or feature? Email us — we build based on user feedback.</p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-[#2D2A3A] bg-[#1C1A27] p-8 text-center">
          <h3 className="text-lg font-semibold text-[#E8E4F0]">Need help with your account?</h3>
          <p className="mt-2 text-sm text-[#9B95A8]">For subscription cancellations, account issues, or billing questions, email us with your registered email address and we&apos;ll sort it out.</p>
          <a href="mailto:mondliwainga@gmail.com" className="mt-4 inline-block rounded-xl bg-[#8B5CF6] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7C3AED] transition">
            Email Us
          </a>
        </div>
      </main>
    </div>
  );
}

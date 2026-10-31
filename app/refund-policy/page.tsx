import Link from "next/link";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-[#13111C] text-[#E8E4F0]">
      <nav className="border-b border-[#2D2A3A] bg-[#13111C]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#E8E4F0]">Client<span className="text-[#8B5CF6]">Craft</span></Link>
          <Link href="/" className="text-sm text-[#9B95A8] hover:text-[#8B5CF6] transition">← Back to Home</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-white">Refund &amp; Cancellation Policy</h1>
        <p className="mt-2 text-sm text-[#6B6580]">Last updated: August 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[#9B95A8]">
          <section>
            <h2 className="text-lg font-semibold text-[#E8E4F0] mb-3">Free Plan</h2>
            <p>The ClientCraft free plan provides 5 document generations per day at no cost. No payment is required and no refund applies to the free plan.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E4F0] mb-3">Pro Plan Subscription</h2>
            <p>The ClientCraft Pro plan is a monthly recurring subscription that provides unlimited document generations. By subscribing to the Pro plan, you agree to be charged the stated monthly fee on a recurring basis until you cancel.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E4F0] mb-3">No Refunds</h2>
            <p>ClientCraft is a digital service that provides immediate access to AI-generated content upon payment. Due to the nature of digital services:</p>
            <ul className="mt-2 list-disc ml-6 space-y-1">
              <li>All payments are final and non-refundable.</li>
              <li>No partial refunds are provided for unused portions of a billing period.</li>
              <li>Once a subscription payment is processed, it cannot be reversed.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E4F0] mb-3">Cancellation</h2>
            <p>You may cancel your Pro subscription at any time. Upon cancellation:</p>
            <ul className="mt-2 list-disc ml-6 space-y-1">
              <li>You will retain Pro access until the end of your current billing period.</li>
              <li>Your account will automatically revert to the free plan (5 generations per day) when the paid period ends.</li>
              <li>No further charges will be applied after cancellation.</li>
              <li>No refund will be issued for the remaining days in your current billing period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E4F0] mb-3">How to Cancel</h2>
            <p>To cancel your subscription, contact us at <a href="mailto:mondliwainga@gmail.com" className="text-[#8B5CF6] hover:underline">mondliwainga@gmail.com</a> with your account email address. Cancellation will be processed within 24 hours.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E4F0] mb-3">Exceptions</h2>
            <p>In exceptional circumstances (e.g., duplicate charges due to technical errors), please contact us at <a href="mailto:mondliwainga@gmail.com" className="text-[#8B5CF6] hover:underline">mondliwainga@gmail.com</a> and we will review your case individually.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E4F0] mb-3">Contact</h2>
            <p>For billing questions or cancellation requests: <a href="mailto:mondliwainga@gmail.com" className="text-[#8B5CF6] hover:underline">mondliwainga@gmail.com</a></p>
          </section>
        </div>
      </main>
    </div>
  );
}

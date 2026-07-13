"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

export default function SupportPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    }
    loadUser();
  }, []);

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();

    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user?.id || null,
        email,
        subject,
        message,
      }),
    });

    const data = await response.json();

    if (data.error) {
      setError(data.error);
    } else {
      setSent(true);
    }
    setSending(false);
  }

  const commonIssues = [
    { q: "MT5 trades not syncing", a: "Check that Algo Trading is enabled (green button) in MT5, and that piptrak.com is in Tools → Options → Expert Advisors → allowed URLs." },
    { q: "AI review says 'upgrade to Pro'", a: "Free plan includes 10 AI reviews per month. Upgrade on the Pricing page for unlimited reviews." },
    { q: "Trades from wrong account showing", a: "Go to Accounts page and make sure the correct account is set as 'Active' — this filters what you see everywhere." },
    { q: "Didn't receive confirmation email", a: "Check spam folder for an email from noreply@piptrak.com. Still nothing? Contact us below." },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-8">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            💬 Support
          </p>
          <h1 className="text-4xl font-bold">Need Help?</h1>
          <p className="mt-2 text-white/40">
            Check common issues below, or email us directly at{" "}
            <a href="mailto:support@piptrak.com" className="text-blue-400 hover:underline">support@piptrak.com</a>
          </p>
        </div>

        {/* Common Issues */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-lg font-semibold">Common Issues</h2>
          <div className="space-y-3">
            {commonIssues.map((issue, i) => (
              <details key={i} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <summary className="cursor-pointer text-sm font-semibold">{issue.q}</summary>
                <p className="mt-2 text-sm text-white/50">{issue.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        {sent ? (
          <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-8 text-center">
            <p className="text-4xl mb-3">✅</p>
            <h2 className="text-xl font-semibold text-green-400 mb-2">Message sent</h2>
            <p className="text-white/50">We'll get back to you at {email} as soon as possible.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-lg font-semibold">Contact Us</h2>
            {error && (
              <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <form onSubmit={submitTicket} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Your Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Subject</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. MT5 not syncing"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={5}
                  required
                  placeholder="Describe the issue in detail..."
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-2xl bg-blue-600 py-4 font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
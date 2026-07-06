"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  async function subscribe(plan: "pro" | "elite") {
    if (!user) {
      router.push("/register");
      return;
    }

    setLoading(plan);

    try {
      const priceId = plan === "pro"
        ? "price_1Tq42NRn5RJmd0sKE0HfKhuq"
        : "price_1Tq41DRn5RJmd0sKmiaDrWmr";

      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error: " + JSON.stringify(data));
      }
    } catch (err) {
      alert("Error: " + String(err));
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <nav className="flex items-center justify-between border-b border-white/5 bg-black/80 px-6 py-4">
        <span className="text-lg font-bold">Trading AI Journal</span>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-xl bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          Back to App
        </button>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold">Simple Pricing</h1>
          <p className="mt-4 text-white/40">Start free. Upgrade when ready.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Free */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/40">Free</p>
            <p className="mt-2 text-4xl font-bold">€0</p>
            <p className="text-sm text-white/40">forever</p>
            <p className="mt-2 text-sm text-white/60">Perfect to get started</p>
            <ul className="mt-6 space-y-3">
              {["Manual trade journal", "Basic AI review", "Dashboard & analytics", "10 AI reviews/month"].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-8 w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold hover:bg-white/10"
            >
              Current Plan
            </button>
          </div>

          {/* Pro */}
          <div className="rounded-3xl border border-blue-500/50 bg-blue-500/10 p-6">
            <p className="text-sm text-blue-400">Pro</p>
            <p className="mt-2 text-4xl font-bold">€19</p>
            <p className="text-sm text-white/40">per month</p>
            <p className="mt-2 text-sm text-white/60">For active traders</p>
            <ul className="mt-6 space-y-3">
              {[
                "Everything in Free",
                "Unlimited AI reviews",
                "Screenshot AI analysis",
                "Weekly AI reports",
                "Psychology coaching",
                "Advanced analytics",
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => subscribe("pro")}
              disabled={loading === "pro"}
              className="mt-8 w-full rounded-2xl bg-blue-600 py-3 font-semibold transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === "pro" ? "Loading..." : "Upgrade to Pro"}
            </button>
          </div>

          {/* Elite */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/40">Elite</p>
            <p className="mt-2 text-4xl font-bold">€49</p>
            <p className="text-sm text-white/40">per month</p>
            <p className="mt-2 text-sm text-white/60">For prop firm traders</p>
            <ul className="mt-6 space-y-3">
              {[
                "Everything in Pro",
                "MT5 auto import",
                "Prop firm tools",
                "Priority AI coaching",
                "Custom trading rules",
                "Monthly AI reports",
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => subscribe("elite")}
              disabled={loading === "elite"}
              className="mt-8 w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold transition hover:bg-white/10 disabled:opacity-50"
            >
              {loading === "elite" ? "Loading..." : "Upgrade to Elite"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
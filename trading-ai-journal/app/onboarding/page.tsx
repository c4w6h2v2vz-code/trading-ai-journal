"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const steps = [
  { id: 1, title: "Welcome", icon: "👋" },
  { id: 2, title: "Your Profile", icon: "👤" },
  { id: 3, title: "Trading Rules", icon: "📋" },
  { id: 4, title: "First Trade", icon: "📈" },
  { id: 5, title: "All Done!", icon: "🎉" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    trading_style: "Day Trading",
    main_market: "Forex",
    experience: "Beginner / Growing Trader",
    prop_firm: "",
    account_size: "",
  });

  const [rule, setRule] = useState({
    title: "",
    description: "",
  });

  async function saveProfile() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      await supabase.from("profiles").update({
        trading_style: profile.trading_style,
        main_market: profile.main_market,
        experience: profile.experience,
        prop_firm: profile.prop_firm,
        onboarded: true,
      }).eq("id", user.id);

      setStep(3);
    } catch (err) {
      console.error("Profile save error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function saveRule() {
    if (!rule.title) { setStep(4); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("trading_rules").insert([{
      user_id: user.id,
      title: rule.title,
      description: rule.description,
    }]);

    setSaving(false);
    setStep(4);
  }

  async function finish() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
    }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-6 py-12">
      {/* Progress bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
                step >= s.id ? "bg-blue-600" : "bg-white/10"
              }`}>
                {step > s.id ? "✓" : s.icon}
              </div>
              <p className="hidden md:block text-xs text-white/40">{s.title}</p>
            </div>
          ))}
        </div>
        <div className="h-1 rounded-full bg-white/10">
          <div
            className="h-1 rounded-full bg-blue-600 transition-all"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-lg">

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="text-center">
            <p className="text-6xl mb-6">👋</p>
            <h1 className="text-4xl font-bold mb-4">Welcome to Trading AI Journal</h1>
            <p className="text-white/50 mb-8 text-lg">
              Your personal AI trading coach. Let's set up your account in 2 minutes.
            </p>
            <div className="space-y-3 text-left mb-8">
              {[
                "🤖 AI reviews every trade you take",
                "📸 Analyzes your chart screenshots",
                "🧠 Detects your trading mistakes",
                "📊 Tracks your performance over time",
                "🔗 Connects to your MT5 account",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-white/80">{f}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold hover:bg-blue-700 transition"
            >
              Let's Get Started →
            </button>
          </div>
        )}

        {/* Step 2 — Profile */}
        {step === 2 && (
          <div>
            <h2 className="text-3xl font-bold mb-2">Tell us about yourself</h2>
            <p className="text-white/40 mb-6">This helps AI give you better coaching.</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/40 mb-2 block">Trading Style</label>
                <select
                  value={profile.trading_style}
                  onChange={e => setProfile({...profile, trading_style: e.target.value})}
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                >
                  {["Day Trading", "Swing Trading", "Scalping", "Position Trading"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/40 mb-2 block">Main Market</label>
                <select
                  value={profile.main_market}
                  onChange={e => setProfile({...profile, main_market: e.target.value})}
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                >
                  {["Forex", "Crypto", "Stocks", "Futures", "Commodities"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/40 mb-2 block">Experience Level</label>
                <select
                  value={profile.experience}
                  onChange={e => setProfile({...profile, experience: e.target.value})}
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                >
                  {["Beginner / Growing Trader", "Intermediate", "Advanced", "Professional"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/40 mb-2 block">Prop Firm (optional)</label>
                <input
                  value={profile.prop_firm}
                  onChange={e => setProfile({...profile, prop_firm: e.target.value})}
                  placeholder="e.g. FTMO, MyForexFunds, FundedNext"
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="mt-6 w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Continue →"}
            </button>
          </div>
        )}

        {/* Step 3 — Trading Rules */}
        {step === 3 && (
          <div>
            <h2 className="text-3xl font-bold mb-2">Add your first trading rule</h2>
            <p className="text-white/40 mb-6">AI will check this rule on every trade. You can add more later.</p>

            <div className="space-y-4">
              <input
                value={rule.title}
                onChange={e => setRule({...rule, title: e.target.value})}
                placeholder="e.g. Only trade A+ setups"
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
              />
              <textarea
                value={rule.description}
                onChange={e => setRule({...rule, description: e.target.value})}
                placeholder="Describe your rule in detail..."
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/40 mb-2">💡 Examples of good trading rules:</p>
              {[
                "Only trade during London and NY session",
                "Always use minimum 1:2 risk reward",
                "No trading after 2 consecutive losses",
                "Never risk more than 1% per trade",
              ].map((r, i) => (
                <p key={i} className="text-sm text-white/60 py-1 cursor-pointer hover:text-white"
                  onClick={() => setRule({...rule, title: r})}>
                  → {r}
                </p>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(4)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 font-semibold hover:bg-white/10 transition"
              >
                Skip for now
              </button>
              <button
                onClick={saveRule}
                disabled={saving}
                className="flex-1 rounded-2xl bg-blue-600 py-4 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Add Rule →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — First trade */}
        {step === 4 && (
          <div className="text-center">
            <p className="text-6xl mb-6">📈</p>
            <h2 className="text-3xl font-bold mb-4">You're ready to trade!</h2>
            <p className="text-white/40 mb-8">Choose how you want to start tracking your trades.</p>

            <div className="space-y-4 text-left mb-8">
              <button
                onClick={() => router.push("/journal")}
                className="w-full rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5 text-left hover:bg-blue-500/20 transition"
              >
                <p className="font-bold text-blue-400">📝 Add Manual Trade</p>
                <p className="text-sm text-white/40 mt-1">Log a trade manually with full details and AI review</p>
              </button>

              <button
                onClick={() => router.push("/mt5")}
                className="w-full rounded-3xl border border-green-500/30 bg-green-500/10 p-5 text-left hover:bg-green-500/20 transition"
              >
                <p className="font-bold text-green-400">🔗 Connect MT5</p>
                <p className="text-sm text-white/40 mt-1">Auto import trades from your FTMO MT5 account</p>
              </button>

              <button
                onClick={() => setStep(5)}
                className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left hover:bg-white/10 transition"
              >
                <p className="font-bold text-white/60">⏭️ Skip for now</p>
                <p className="text-sm text-white/40 mt-1">Go straight to your dashboard</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Done */}
        {step === 5 && (
          <div className="text-center">
            <p className="text-6xl mb-6">🎉</p>
            <h2 className="text-3xl font-bold mb-4">You're all set!</h2>
            <p className="text-white/40 mb-8 text-lg">
              Your AI trading coach is ready. Start logging trades and watch your performance improve.
            </p>

            <div className="space-y-3 text-left mb-8">
              {[
                "✅ Profile set up",
                "✅ Trading rules saved",
                "✅ AI coach activated",
                "✅ Dashboard ready",
              ].map((f, i) => (
                <div key={i} className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                  <p className="text-green-300">{f}</p>
                </div>
              ))}
            </div>

            <button
              onClick={finish}
              className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold hover:bg-blue-700 transition"
            >
              Go to Dashboard →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
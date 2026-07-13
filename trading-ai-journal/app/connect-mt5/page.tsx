"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

export default function ConnectMT5Page() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState<"MT5" | "MT4">("MT5");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [broker, setBroker] = useState("");
  const [isPropFirm, setIsPropFirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveAccountAndContinue() {
    if (!accountNumber || !accountName) {
      setMessage("Please enter your account number and a name for it.");
      return;
    }
    setSaving(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase
      .from("trading_accounts")
      .insert([{
        user_id: user.id,
        account_number: accountNumber,
        account_name: accountName,
        platform,
        broker,
        is_prop_firm: isPropFirm,
      }]);

    if (error) {
      setMessage("Error: " + error.message);
      setSaving(false);
      return;
    }

    setMessage("Account saved ✅ Now follow the steps below to connect your terminal.");
    setStep(3);
    setSaving(false);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            🔌 Connect Your Broker
          </p>
          <h1 className="text-4xl font-bold">Connect MT5 or MT4</h1>
          <p className="mt-2 text-white/40">
            One-time setup. After this, your trades sync automatically and PipTrak can review and even execute trades for you.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-4 text-blue-300">
            {message}
          </div>
        )}

        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? "bg-blue-500" : "bg-white/10"}`} />
          ))}
        </div>

        {/* Step 1 — Choose platform */}
        {step === 1 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-semibold mb-4">Step 1 — Which platform do you use?</h2>
            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              <button
                onClick={() => setPlatform("MT5")}
                className={`rounded-2xl border p-5 text-left transition ${
                  platform === "MT5" ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <p className="font-bold text-lg">MetaTrader 5 (MT5)</p>
                <p className="text-sm text-white/40 mt-1">The newer, most common platform. Used by FTMO, most brokers.</p>
              </button>
              <button
                onClick={() => setPlatform("MT4")}
                className={`rounded-2xl border p-5 text-left transition ${
                  platform === "MT4" ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <p className="font-bold text-lg">MetaTrader 4 (MT4)</p>
                <p className="text-sm text-white/40 mt-1">Older platform, still widely used by many brokers.</p>
              </button>
            </div>
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 mb-6">
              <p className="text-sm text-yellow-300">
                💡 Using cTrader, DXtrade, or another platform? Skip this and use{" "}
                <a href="/import" className="underline">CSV Import</a> instead — it works with any platform.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full rounded-2xl bg-blue-600 py-4 font-semibold hover:bg-blue-700 transition"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Account details */}
        {step === 2 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-semibold mb-4">Step 2 — Your account details</h2>
            <p className="text-sm text-white/40 mb-4">
              Find your account number in {platform} at the top of your chart, or in the top-left of the terminal.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Account Number</label>
                <input
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="e.g. 521091015"
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Give it a name</label>
                <input
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder="e.g. FTMO Live, My Demo"
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Broker / Prop Firm</label>
                <input
                  value={broker}
                  onChange={e => setBroker(e.target.value)}
                  placeholder="e.g. FTMO, IC Markets"
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPropFirm(!isPropFirm)}
                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                    isPropFirm ? "bg-blue-600 border-blue-600" : "border-white/20 bg-white/5"
                  }`}
                >
                  {isPropFirm && <span className="text-xs text-white">✓</span>}
                </button>
                <label className="text-sm text-white/50">This is a prop firm account</label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-semibold hover:bg-white/10 transition"
              >
                ← Back
              </button>
              <button
                onClick={saveAccountAndContinue}
                disabled={saving}
                className="flex-1 rounded-2xl bg-blue-600 py-4 font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? "Saving..." : "Save & Continue →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Install EA instructions */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
              <h2 className="text-xl font-semibold text-green-400 mb-2">✅ Account Saved</h2>
              <p className="text-sm text-white/60">
                Now install the PipTrak connector in {platform} to start syncing trades automatically.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-lg font-semibold mb-4">1️⃣ Allow PipTrak in {platform}</h3>
              <div className="space-y-2 text-sm text-white/60">
                <p>1. Open {platform} → click <strong>Tools</strong> → <strong>Options</strong></p>
                <p>2. Click the <strong>Expert Advisors</strong> tab</p>
                <p>3. Check the box <strong>"Allow WebRequest for listed URL"</strong></p>
                <p>4. Add this URL to the list: <code className="rounded bg-black/50 px-2 py-1 text-blue-400">https://piptrak.com</code></p>
                <p>5. Click <strong>OK</strong></p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-lg font-semibold mb-4">2️⃣ Install the TradingAIConnector</h3>
              <div className="space-y-2 text-sm text-white/60 mb-4">
                <p>1. In {platform}, press <strong>F4</strong> to open MetaEditor</p>
                <p>2. Right click on <strong>Experts</strong> in the Navigator → <strong>New</strong> → <strong>Expert Advisor (template)</strong></p>
                <p>3. Name it <strong>TradingAIConnector</strong> and finish the wizard</p>
                <p>4. Delete all the placeholder code, and paste in the PipTrak connector code (ask support if you don't have it yet)</p>
                <p>5. Press <strong>F7</strong> to compile — it should say "0 errors"</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-lg font-semibold mb-4">3️⃣ Attach it to a chart</h3>
              <div className="space-y-2 text-sm text-white/60 mb-4">
                <p>1. Open any chart, e.g. EURUSD</p>
                <p>2. In the Navigator, find <strong>TradingAIConnector</strong> under Expert Advisors</p>
                <p>3. Drag it onto the chart</p>
                <p>4. In the settings that pop up, set:</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-white/70 space-y-1">
                <p>ApiUrl = https://piptrak.com/api/mt5</p>
                <p>SecretKey = (shown in your Settings page)</p>
                <p>DailyLossLimitPercent = 3.0</p>
                <p>DailyProfitTargetPercent = 3.0</p>
                <p>EnableAutoClose = true</p>
                <p>SignalCheckInterval = 30</p>
              </div>
              <p className="text-sm text-white/60 mt-4">5. Click <strong>OK</strong>. Make sure the <strong>Algo Trading</strong> button (top toolbar) is green/enabled.</p>
            </div>

            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">✅ You're done!</h3>
              <p className="text-sm text-white/60 mb-4">
                Check the "Experts" tab at the bottom of {platform} — you should see "TradingAIConnector started with Risk Guardian".
                Your trades will now appear in your Journal automatically as you trade.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/journal")}
                  className="flex-1 rounded-2xl bg-blue-600 py-3 font-semibold hover:bg-blue-700 transition"
                >
                  Go to Journal
                </button>
                <button
                  onClick={() => router.push("/accounts")}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold hover:bg-white/10 transition"
                >
                  Manage Accounts
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
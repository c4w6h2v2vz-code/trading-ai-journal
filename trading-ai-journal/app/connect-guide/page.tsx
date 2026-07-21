"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

export default function ConnectGuidePage() {
  const router = useRouter();
  const [accountNumber, setAccountNumber] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("active_account");
    if (saved) setAccountNumber(JSON.parse(saved).account_number);
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button onClick={() => router.push("/accounts")} className="mb-4 text-sm text-white/40 hover:text-white">← Back to Accounts</button>

        <div className="mb-8">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            🔌 MT5 Setup Guide
          </p>
          <h1 className="text-4xl font-bold">Connect your MT5 account</h1>
          <p className="mt-2 text-white/50">
            Follow these 6 steps once. After this, every trade you close syncs to PipTrak automatically,
            and Risk Guardian protects your account.
          </p>
        </div>

        {/* Step 1 */}
        <Step num="1" title="Add your account in PipTrak first">
          <p className="mb-3 text-sm text-white/60">
            Before anything else, your MT5 account number must be registered here. Go to Accounts → Add New Account
            and enter the exact login number MT5 shows you.
          </p>
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-3">
            <p className="text-xs text-yellow-300">
              💡 Find your number in MT5: top-left <strong>Navigator panel → Accounts</strong>. It's the number next to your broker name
              (e.g. <strong>26503548</strong>). This is NOT your broker portal ID — use the number MT5 itself displays.
            </p>
          </div>
          {accountNumber && (
            <p className="mt-3 text-sm text-green-400">✓ Your active account: {accountNumber}</p>
          )}
        </Step>

        {/* Step 2 */}
        <Step num="2" title="Download the PipTrak connector">
          <p className="mb-3 text-sm text-white/60">
            This is the Expert Advisor (EA) that connects MT5 to PipTrak.
          </p>
          <a href="/downloads/TradingAIConnector.mq5" download className="inline-block rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-700">
            ⬇ Download TradingAIConnector.mq5
          </a>
        </Step>

        {/* Step 3 */}
        <Step num="3" title="Install it in MT5">
          <ol className="space-y-2 text-sm text-white/60">
            <li>1. In MT5, click <strong>File → Open Data Folder</strong></li>
            <li>2. Open the <strong>MQL5 → Experts</strong> folder</li>
            <li>3. Copy the downloaded <strong>TradingAIConnector.mq5</strong> file into it</li>
            <li>4. Back in MT5, right-click <strong>Expert Advisors</strong> in the Navigator → <strong>Refresh</strong></li>
          </ol>
        </Step>

        {/* Step 4 */}
        <Step num="4" title="Allow PipTrak's web address">
          <p className="mb-3 text-sm text-white/60">
            MT5 blocks web requests by default. You must whitelist PipTrak or nothing will sync.
          </p>
          <ol className="space-y-2 text-sm text-white/60">
            <li>1. In MT5: <strong>Tools → Options → Expert Advisors</strong> tab</li>
            <li>2. Check <strong>"Allow WebRequest for listed URL"</strong></li>
            <li>3. Click Add and paste this exact address:</li>
          </ol>
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/50 p-3">
            <code className="flex-1 text-sm text-green-400">https://www.piptrak.com</code>
            <button onClick={() => navigator.clipboard.writeText("https://www.piptrak.com")} className="rounded-xl bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">Copy</button>
          </div>
          <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-xs text-red-300">
              ⚠️ Must be exactly <strong>https://www.piptrak.com</strong> (with www). Without this, you'll see error "-1" in MT5.
            </p>
          </div>
        </Step>

        {/* Step 5 */}
        <Step num="5" title="Turn on Algo Trading & attach to a chart">
          <ol className="space-y-2 text-sm text-white/60">
            <li>1. Click the <strong>Algo Trading</strong> button in the top toolbar — it must be <strong className="text-green-400">green</strong></li>
            <li>2. Open any chart (e.g. EURUSD)</li>
            <li>3. Drag <strong>TradingAIConnector</strong> from the Navigator onto the chart</li>
            <li>4. In the popup, make sure <strong>ApiUrl</strong> is <code className="text-green-400">https://www.piptrak.com/api/mt5</code> and <strong>UseRemoteSettings</strong> is <strong>true</strong></li>
            <li>5. Click OK</li>
          </ol>
        </Step>

        {/* Step 6 */}
        <Step num="6" title="Confirm it's working">
          <p className="mb-3 text-sm text-white/60">
            Open the <strong>Experts</strong> tab at the bottom of MT5. You should see:
          </p>
          <div className="rounded-2xl border border-white/10 bg-black/50 p-3 font-mono text-xs text-white/70 space-y-1">
            <p>=== TradingAIConnector v2 STARTED ===</p>
            <p>Account: [your number]</p>
            <p className="text-green-400">&gt;&gt;&gt; Settings synced from PipTrak - Loss limit: X% | Guardian: ON</p>
            <p className="text-green-400">Sent trade -&gt; Status: 200</p>
          </div>
          <p className="mt-3 text-sm text-white/60">
            Once you see <strong className="text-green-400">Status: 200</strong>, your trades are syncing. Check your{" "}
            <button onClick={() => router.push("/journal")} className="text-blue-400 underline">Journal</button>.
          </p>
        </Step>

        {/* Troubleshooting */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-xl font-semibold">🛠 Troubleshooting</h2>
          <div className="space-y-3">
            <Trouble code="Status: 401" meaning="Wrong secret key" fix="Leave the SecretKey field at its default. Don't change it." />
            <Trouble code="Status: 404" meaning="Account not registered" fix="Your MT5 account number isn't added in PipTrak, or has a typo. Go to Accounts and re-add the exact number MT5 shows." />
            <Trouble code="Status: -1" meaning="URL blocked by MT5" fix="You skipped Step 4. Add https://www.piptrak.com to Tools → Options → Expert Advisors → allowed URLs." />
            <Trouble code="Status: 405" meaning="Wrong web address" fix="Your ApiUrl is missing 'www'. It must be https://www.piptrak.com/api/mt5" />
            <Trouble code="Status: 500" meaning="Server error" fix="Usually temporary. If it persists, contact support from the Support page." />
            <Trouble code="Scanning 0 deals" meaning="No closed trades yet" fix="The EA only syncs closed trades. Once you close a position, it appears automatically." />
          </div>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => router.push("/support")} className="text-sm text-white/40 hover:text-white">
            Still stuck? Contact support →
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Step({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">{num}</span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="pl-11">{children}</div>
    </div>
  );
}

function Trouble({ code, meaning, fix }: { code: string; meaning: string; fix: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <div className="flex items-center gap-2 mb-1">
        <code className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">{code}</code>
        <span className="text-sm font-semibold text-white/70">{meaning}</span>
      </div>
      <p className="text-xs text-white/50">{fix}</p>
    </div>
  );
}
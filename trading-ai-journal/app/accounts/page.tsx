"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type Account = {
  id: string;
  account_number: string;
  account_name: string;
  platform: string;
  broker: string;
  account_size: number;
  is_active: boolean;
  is_prop_firm: boolean;
  prop_firm_name: string;
  challenge_phase: string;
  daily_loss_limit_percent: number;
  risk_guardian_enabled: boolean;
};

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState<string | null>(null);
  const [editingRisk, setEditingRisk] = useState<string | null>(null);
  const [riskValue, setRiskValue] = useState(3.0);

  async function saveRiskLimit(accountId: string) {
    const { error } = await supabase
      .from("trading_accounts")
      .update({ daily_loss_limit_percent: riskValue })
      .eq("id", accountId);

    if (error) {
      setMessage("Error: " + error.message);
      return;
    }

    setAccounts(accounts.map(a => a.id === accountId ? { ...a, daily_loss_limit_percent: riskValue } : a));
    setEditingRisk(null);
    setMessage(`Daily loss limit set to ${riskValue}% ✅ Your EA will pick this up within 30 seconds.`);
  }

  async function toggleGuardian(account: Account) {
    const newValue = !account.risk_guardian_enabled;
    const { error } = await supabase
      .from("trading_accounts")
      .update({ risk_guardian_enabled: newValue })
      .eq("id", account.id);

    if (error) {
      setMessage("Error: " + error.message);
      return;
    }

    setAccounts(accounts.map(a => a.id === account.id ? { ...a, risk_guardian_enabled: newValue } : a));
    setMessage(newValue ? "Risk Guardian enabled ✅" : "Risk Guardian disabled ⚠️ Your account is no longer protected.");
  }
  const [form, setForm] = useState({
    account_number: "",
    account_name: "",
    platform: "MT5",
    broker: "",
    account_size: 10000,
    is_prop_firm: false,
    prop_firm_name: "",
    challenge_phase: "Phase 1",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("trading_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setAccounts(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function addAccount() {
    if (!form.account_number || !form.account_name) {
      setMessage("Please fill in account number and name.");
      return;
    }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("trading_accounts")
      .insert([{ ...form, user_id: user.id }])
      .select()
      .single();

    if (error) {
      setMessage("Error: " + error.message);
      setSaving(false);
      return;
    }

    setAccounts([data, ...accounts]);
    setShowForm(false);

    if (form.platform === "MT5" || form.platform === "MT4") {
      setShowInstallGuide(form.platform);
      setMessage("Account saved ✅ Follow the steps below to connect your terminal.");
    } else {
      setMessage("Account added ✅ Use CSV Import to bring in your trade history.");
    }

    setForm({
      account_number: "",
      account_name: "",
      platform: "MT5",
      broker: "",
      account_size: 10000,
      is_prop_firm: false,
      prop_firm_name: "",
      challenge_phase: "Phase 1",
    });
    setSaving(false);
  }

  async function setActive(accountId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("trading_accounts")
      .update({ is_active: false })
      .eq("user_id", user.id);

    await supabase
      .from("trading_accounts")
      .update({ is_active: true })
      .eq("id", accountId);

    const activeAccount = accounts.find(a => a.id === accountId);
    if (activeAccount) {
      localStorage.setItem("active_account", JSON.stringify({
        id: accountId,
        account_number: activeAccount.account_number,
        account_name: activeAccount.account_name,
        platform: activeAccount.platform,
      }));
    }

    setAccounts(accounts.map(a => ({
      ...a,
      is_active: a.id === accountId,
    })));

    setMessage("Active account changed ✅ Redirecting to dashboard...");
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  async function deleteAccount(accountId: string) {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    if (!confirm(`Delete "${account.account_name}" and ALL its synced trades? This cannot be undone.`)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete the synced trades for this account first
    await supabase
      .from("mt5_trades")
      .delete()
      .eq("user_id", user.id)
      .eq("account", account.account_number);

    // Then delete the account itself
    await supabase
      .from("trading_accounts")
      .delete()
      .eq("id", accountId);

    // Clear stale localStorage if this was the active account
    const saved = localStorage.getItem("active_account");
    if (saved && JSON.parse(saved).id === accountId) {
      localStorage.removeItem("active_account");
    }

    setAccounts(accounts.filter(a => a.id !== accountId));
    setMessage("Account and its trades deleted ✅");
  }

  if (loading) return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            Trading Accounts
          </p>
          <h1 className="text-4xl font-bold">My Accounts</h1>
          <p className="mt-2 text-white/40">
            Add and connect your trading accounts. MT4/MT5 sync automatically once connected; other platforms use CSV import.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-300">
            {message}
          </div>
        )}

        {/* Install Guide (shown right after saving MT4/MT5 account) */}
        {showInstallGuide && (
          <div className="mb-6 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Connect {showInstallGuide} — 3 Steps</h3>
                <button onClick={() => setShowInstallGuide(null)} className="text-white/30 hover:text-white text-sm">✕</button>
              </div>

              <div className="space-y-2 text-sm text-white/60 mb-6">
                <p className="font-semibold text-white/80">1️⃣ Allow PipTrak in {showInstallGuide}</p>
                <p>Open {showInstallGuide} → Tools → Options → Expert Advisors tab</p>
                <p>Check "Allow WebRequest for listed URL" and add:{" "}
                  <code className="rounded bg-black/50 px-2 py-1 text-blue-400">https://piptrak.com</code>
                </p>
              </div>

              <div className="space-y-2 text-sm text-white/60 mb-6">
                <p className="font-semibold text-white/80">2️⃣ Install the TradingAIConnector</p>
                <p>Press F4 to open MetaEditor. New. Expert Advisor (template). Name it TradingAIConnector.</p>
                <p><a href="/downloads/TradingAIConnector.mq5" download className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">Download TradingAIConnector.mq5</a></p>
                <p>Open the downloaded file, copy all its contents, paste into MetaEditor replacing the template code, then press F7 to compile (should say "0 errors")</p>
              </div>

              <div className="space-y-2 text-sm text-white/60 mb-4">
                <p className="font-semibold text-white/80">3️⃣ Attach it to a chart</p>
                <p>Drag TradingAIConnector onto any chart (e.g. EURUSD) and set:</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-white/70 space-y-1">
                <p>ApiUrl = https://piptrak.com/api/mt5</p>
                <p>SecretKey = (shown in your Settings page)</p>
                <p>DailyLossLimitPercent = 3.0</p>
                <p>EnableProfitLock = false</p>
                <p>DailyProfitTargetPercent = 10.0</p>
                <p>EnableAutoClose = true</p>
                <p>SignalCheckInterval = 30</p>
              </div>
              <p className="text-sm text-white/60 mt-4">
                Make sure the <strong>Algo Trading</strong> button is enabled (green). Check the "Experts" tab for "TradingAIConnector started with Risk Guardian" to confirm it's working.
              </p>
            </div>
          </div>
        )}

        {/* Add Account Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 w-full rounded-2xl bg-blue-600 py-3 font-semibold transition hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Add New Account"}
        </button>

        {/* Add Account Form */}
        {showForm && (
          <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-xl font-semibold">Add New Account</h2>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-white/40 mb-1 block">Account Number</label>
                  <input
                    value={form.account_number}
                    onChange={e => setForm({ ...form, account_number: e.target.value })}
                    placeholder="e.g. 521091015"
                    className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/40 mb-1 block">Account Name</label>
                  <input
                    value={form.account_name}
                    onChange={e => setForm({ ...form, account_name: e.target.value })}
                    placeholder="e.g. FTMO Live"
                    className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-white/40 mb-1 block">Platform</label>
                  <select
                    value={form.platform}
                    onChange={e => setForm({ ...form, platform: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                  >
                    <option>MT5</option>
                    <option>MT4</option>
                    <option>cTrader</option>
                    <option>DXtrade</option>
                    <option>Match-Trader</option>
                    <option>Other</option>
                  </select>
                  {(form.platform !== "MT5" && form.platform !== "MT4") && (
                    <p className="mt-1 text-xs text-yellow-400">
                      💡 This platform needs manual sync — use CSV Import after saving.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-white/40 mb-1 block">Broker/Firm</label>
                  <input
                    value={form.broker}
                    onChange={e => setForm({ ...form, broker: e.target.value })}
                    placeholder="e.g. FTMO, MyForexFunds"
                    className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/40 mb-1 block">Account Size ($)</label>
                <input
                  type="number"
                  value={form.account_size}
                  onChange={e => setForm({ ...form, account_size: Number(e.target.value) })}
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm({ ...form, is_prop_firm: !form.is_prop_firm })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${form.is_prop_firm ? "bg-blue-600" : "bg-white/20"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${form.is_prop_firm ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <label className="text-sm text-white/60">This is a Prop Firm account</label>
              </div>

              {form.is_prop_firm && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm text-white/40 mb-1 block">Prop Firm Name</label>
                    <select
                      value={form.prop_firm_name}
                      onChange={e => setForm({ ...form, prop_firm_name: e.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                    >
                      <option>FTMO</option>
                      <option>MyForexFunds</option>
                      <option>FundedNext</option>
                      <option>Apex Trader</option>
                      <option>The Funded Trader</option>
                      <option>E8 Funding</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-white/40 mb-1 block">Challenge Phase</label>
                    <select
                      value={form.challenge_phase}
                      onChange={e => setForm({ ...form, challenge_phase: e.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                    >
                      <option>Phase 1</option>
                      <option>Phase 2</option>
                      <option>Funded</option>
                      <option>Live</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                onClick={addAccount}
                disabled={saving}
                className="w-full rounded-2xl bg-green-600 py-4 font-semibold transition hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Account"}
              </button>
            </div>
          </div>
        )}

        {/* Accounts List */}
        <div className="space-y-4">
          {accounts.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
              <p className="text-4xl mb-4">💼</p>
              <p className="text-white/40">No accounts yet. Add your first trading account.</p>
            </div>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className={`rounded-3xl border p-6 transition ${
                account.is_active
                  ? "border-blue-500/50 bg-blue-500/5"
                  : "border-white/10 bg-white/[0.04]"
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold">{account.account_name}</h3>
                      {account.is_active && (
                        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400 font-bold">
                          Active
                        </span>
                      )}
                      {account.is_prop_firm && (
                        <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400">
                          Prop Firm
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/40">#{account.account_number}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {(account.platform === "MT5" || account.platform === "MT4") && (
                      <button
                        onClick={() => setShowInstallGuide(account.platform)}
                        className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/10 transition"
                      >
                        Setup Guide
                      </button>
                    )}
                    {!account.is_active && (
                      <button
                        onClick={() => setActive(account.id)}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold hover:bg-blue-700 transition"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => deleteAccount(account.id)}
                      className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
{(account.platform === "MT5" || account.platform === "MT4") && (
                  <div className={`mb-3 rounded-2xl border p-4 ${
                    account.risk_guardian_enabled ? "border-red-500/20 bg-red-500/5" : "border-white/10 bg-white/[0.02]"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">🛡 Risk Guardian</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          account.risk_guardian_enabled ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
                        }`}>
                          {account.risk_guardian_enabled ? "Active" : "Off"}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleGuardian(account)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${account.risk_guardian_enabled ? "bg-green-600" : "bg-white/20"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${account.risk_guardian_enabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    {editingRisk === account.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          max="20"
                          value={riskValue}
                          onChange={e => setRiskValue(Number(e.target.value))}
                          className="w-24 rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                        <span className="text-sm text-white/40">% daily loss</span>
                        <button onClick={() => saveRiskLimit(account.id)} className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold hover:bg-green-700">Save</button>
                        <button onClick={() => setEditingRisk(null)} className="rounded-xl bg-white/5 px-3 py-2 text-xs hover:bg-white/10">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white/60">
                          Closes all trades at <span className="font-bold text-red-400">{account.daily_loss_limit_percent ?? 3}%</span> daily loss
                          <span className="text-white/30"> (${((account.account_size * (account.daily_loss_limit_percent ?? 3)) / 100).toFixed(0)})</span>
                        </p>
                        <button
                          onClick={() => { setEditingRisk(account.id); setRiskValue(account.daily_loss_limit_percent ?? 3); }}
                          className="rounded-xl bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <p className="text-xs text-white/40">Platform</p>
                    <p className="font-semibold mt-1">{account.platform}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <p className="text-xs text-white/40">Broker</p>
                    <p className="font-semibold mt-1">{account.broker || "N/A"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <p className="text-xs text-white/40">Account Size</p>
                    <p className="font-semibold mt-1 text-green-400">${account.account_size.toLocaleString()}</p>
                  </div>
                  {account.is_prop_firm && (
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <p className="text-xs text-white/40">Phase</p>
                      <p className="font-semibold mt-1 text-orange-400">{account.challenge_phase}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
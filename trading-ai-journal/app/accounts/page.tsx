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
};

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
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
    } else {
      setAccounts([data, ...accounts]);
      setShowForm(false);
      setMessage("Account added ✅");
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
    }
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

    setAccounts(accounts.map(a => ({
      ...a,
      is_active: a.id === accountId,
    })));

    setMessage("Active account changed ✅");
  }

  async function deleteAccount(accountId: string) {
    if (!confirm("Delete this account?")) return;

    await supabase
      .from("trading_accounts")
      .delete()
      .eq("id", accountId);

    setAccounts(accounts.filter(a => a.id !== accountId));
    setMessage("Account deleted ✅");
  }

  if (loading) return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="space-y-4">
          {[1,2].map(i => (
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
            Manage multiple trading accounts. Switch between them to see each account's trades.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-300">
            {message}
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
                    onChange={e => setForm({...form, account_number: e.target.value})}
                    placeholder="e.g. 521091015"
                    className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/40 mb-1 block">Account Name</label>
                  <input
                    value={form.account_name}
                    onChange={e => setForm({...form, account_name: e.target.value})}
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
                    onChange={e => setForm({...form, platform: e.target.value})}
                    className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                  >
                    <option>MT5</option>
                    <option>MT4</option>
                    <option>cTrader</option>
                    <option>DXtrade</option>
                    <option>Match-Trader</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/40 mb-1 block">Broker/Firm</label>
                  <input
                    value={form.broker}
                    onChange={e => setForm({...form, broker: e.target.value})}
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
                  onChange={e => setForm({...form, account_size: Number(e.target.value)})}
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm({...form, is_prop_firm: !form.is_prop_firm})}
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
                      onChange={e => setForm({...form, prop_firm_name: e.target.value})}
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
                      onChange={e => setForm({...form, challenge_phase: e.target.value})}
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
                  <div className="flex gap-2">
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
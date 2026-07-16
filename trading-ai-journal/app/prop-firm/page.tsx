"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type Account = {
  id: string;
  account_number: string;
  account_name: string;
  account_size: number;
  max_drawdown_percent: number;
  daily_drawdown_percent: number;
  profit_target_percent: number;
  challenge_days: number;
  challenge_start_date: string;
  is_prop_firm: boolean;
  prop_firm_name: string;
};

export default function PropFirmPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  // Editable local copy while editing
  const [form, setForm] = useState({
    account_size: 10000,
    max_drawdown_percent: 10,
    daily_drawdown_percent: 5,
    profit_target_percent: 10,
    challenge_days: 30,
    challenge_start_date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: accs } = await supabase
      .from("trading_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_prop_firm", true)
      .order("created_at", { ascending: false });

    setAccounts(accs || []);

    const savedActive = localStorage.getItem("active_account");
    const activeId = savedActive ? JSON.parse(savedActive).id : null;
    const found = accs?.find(a => a.id === activeId) || accs?.[0] || null;
    setActiveAccount(found);

    if (found) {
      setForm({
        account_size: found.account_size || 10000,
        max_drawdown_percent: found.max_drawdown_percent || 10,
        daily_drawdown_percent: found.daily_drawdown_percent || 5,
        profit_target_percent: found.profit_target_percent || 10,
        challenge_days: found.challenge_days || 30,
        challenge_start_date: found.challenge_start_date || new Date().toISOString().slice(0, 10),
      });

      const accountNumber = found.account_number;

      const { data: manual } = await supabase
        .from("trades")
        .select("profit_loss, created_at")
        .eq("user_id", user.id)
        .eq("trade_source", "Live");

      const { data: mt5 } = await supabase
        .from("mt5_trades")
        .select("profit, created_at")
        .eq("user_id", user.id)
        .eq("account", accountNumber);

      const mt5Mapped = (mt5 || []).map(t => ({
        profit_loss: t.profit,
        created_at: t.created_at,
      }));

      setTrades([...(manual || []), ...mt5Mapped]);
    }

    setLoading(false);
  }

  async function switchAccount(account: Account) {
    setActiveAccount(account);
    localStorage.setItem("active_account", JSON.stringify({
      id: account.id,
      account_number: account.account_number,
      account_name: account.account_name,
    }));
    setForm({
      account_size: account.account_size || 10000,
      max_drawdown_percent: account.max_drawdown_percent || 10,
      daily_drawdown_percent: account.daily_drawdown_percent || 5,
      profit_target_percent: account.profit_target_percent || 10,
      challenge_days: account.challenge_days || 30,
      challenge_start_date: account.challenge_start_date || new Date().toISOString().slice(0, 10),
    });
    setLoading(true);
    await loadData();
  }

  async function saveSettings() {
    if (!activeAccount) return;

    const { error } = await supabase
      .from("trading_accounts")
      .update(form)
      .eq("id", activeAccount.id);

    if (error) {
      setMessage("Error saving: " + error.message);
      return;
    }

    setActiveAccount({ ...activeAccount, ...form });
    setEditing(false);
    setMessage("Challenge settings saved ✅");
  }

  async function deleteAccount() {
    if (!activeAccount) return;
    if (!confirm(`Delete "${activeAccount.account_name}" and its challenge tracking? This cannot be undone.`)) return;

    const { error } = await supabase
      .from("trading_accounts")
      .delete()
      .eq("id", activeAccount.id);

    if (error) {
      setMessage("Error deleting: " + error.message);
      return;
    }

    const remaining = accounts.filter(a => a.id !== activeAccount.id);
    setAccounts(remaining);

    if (remaining.length > 0) {
      switchAccount(remaining[0]);
    } else {
      setActiveAccount(null);
      localStorage.removeItem("active_account");
    }

    setMessage("Account deleted ✅");
  }

  if (loading) return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    </AppShell>
  );

  if (!activeAccount) return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <p className="mb-3 w-fit rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-sm text-orange-300">
            Prop Firm Tracker
          </p>
          <h1 className="text-4xl font-bold">Challenge Tracker</h1>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-4xl mb-4">🏦</p>
          <p className="text-white/40 mb-4">No prop firm accounts yet. Add one to start tracking a challenge.</p>
          <button
            onClick={() => router.push("/accounts")}
            className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 transition"
          >
            + Add Prop Firm Account
          </button>
        </div>
      </div>
    </AppShell>
  );

  const accountSize = activeAccount.account_size || 10000;
  const maxDrawdown = form.max_drawdown_percent;
  const dailyDrawdown = form.daily_drawdown_percent;
  const profitTarget = form.profit_target_percent;
  const challengeDays = form.challenge_days;
  const startDate = form.challenge_start_date;

  const totalPL = trades.reduce((sum, t) => sum + Number(t.profit_loss), 0);
  const maxDrawdownAmount = (accountSize * maxDrawdown) / 100;
  const dailyDrawdownAmount = (accountSize * dailyDrawdown) / 100;
  const profitTargetAmount = (accountSize * profitTarget) / 100;

  const today = new Date().toDateString();
  const todayPL = trades
    .filter(t => new Date(t.created_at).toDateString() === today)
    .reduce((sum, t) => sum + Number(t.profit_loss), 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + challengeDays);
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const daysUsed = challengeDays - daysRemaining;

  const profitProgress = Math.min((totalPL / profitTargetAmount) * 100, 100);
  const drawdownProgress = Math.min((Math.abs(Math.min(totalPL, 0)) / maxDrawdownAmount) * 100, 100);
  const dailyDrawdownProgress = Math.min((Math.abs(Math.min(todayPL, 0)) / dailyDrawdownAmount) * 100, 100);

  const isBreached = totalPL < -maxDrawdownAmount;
  const isDailyBreached = todayPL < -dailyDrawdownAmount;
  const isPassed = totalPL >= profitTargetAmount;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <p className="mb-3 w-fit rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-sm text-orange-300">
            Prop Firm Tracker
          </p>
          <h1 className="text-4xl font-bold">Challenge Tracker</h1>
          <p className="mt-2 text-white/40">Tracking: <strong className="text-white/70">{activeAccount.account_name}</strong> #{activeAccount.account_number}</p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-300">
            {message}
          </div>
        )}

        {/* Account Switcher */}
        {accounts.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {accounts.map(acc => (
              <button
                key={acc.id}
                onClick={() => switchAccount(acc)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  acc.id === activeAccount.id ? "bg-orange-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {acc.account_name}
              </button>
            ))}
          </div>
        )}

        {/* Status Banner */}
        {isBreached && (
          <div className="mb-6 rounded-3xl border border-red-500/50 bg-red-500/10 p-6 text-center">
            <p className="text-2xl font-bold text-red-400">❌ Challenge Failed</p>
            <p className="mt-2 text-white/60">You exceeded the maximum drawdown limit.</p>
          </div>
        )}

        {isDailyBreached && !isBreached && (
          <div className="mb-6 rounded-3xl border border-red-500/50 bg-red-500/10 p-6 text-center">
            <p className="text-2xl font-bold text-red-400">⛔ Daily Limit Reached</p>
            <p className="mt-2 text-white/60">Stop trading for today. Daily loss limit hit.</p>
          </div>
        )}

        {isPassed && !isBreached && (
          <div className="mb-6 rounded-3xl border border-green-500/50 bg-green-500/10 p-6 text-center">
            <p className="text-2xl font-bold text-green-400">🎉 Challenge Passed!</p>
            <p className="mt-2 text-white/60">You hit the profit target. Congratulations!</p>
          </div>
        )}

        {/* Challenge Settings */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Challenge Settings</h2>
            <button
              onClick={() => editing ? saveSettings() : setEditing(true)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${editing ? "bg-green-600" : "bg-white/10 hover:bg-white/20"}`}
            >
              {editing ? "Save" : "Edit"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Setting label="Account Size ($)" value={form.account_size} onChange={v => setForm({ ...form, account_size: v })} editing={editing} />
            <Setting label="Max Drawdown (%)" value={form.max_drawdown_percent} onChange={v => setForm({ ...form, max_drawdown_percent: v })} editing={editing} />
            <Setting label="Daily Drawdown (%)" value={form.daily_drawdown_percent} onChange={v => setForm({ ...form, daily_drawdown_percent: v })} editing={editing} />
            <Setting label="Profit Target (%)" value={form.profit_target_percent} onChange={v => setForm({ ...form, profit_target_percent: v })} editing={editing} />
            <Setting label="Challenge Days" value={form.challenge_days} onChange={v => setForm({ ...form, challenge_days: v })} editing={editing} />
            <div>
              <p className="text-sm text-white/40 mb-1">Start Date</p>
              {editing ? (
                <input type="date" value={form.challenge_start_date} onChange={e => setForm({ ...form, challenge_start_date: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-3 text-white outline-none focus:border-blue-500" />
              ) : (
                <p className="font-semibold">{form.challenge_start_date}</p>
              )}
            </div>
          </div>

          <button
            onClick={deleteAccount}
            className="mt-6 w-full rounded-2xl border border-red-500/20 bg-red-500/5 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition"
          >
            🗑 Delete This Account
          </button>
        </div>

        {/* Progress Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-white/40">Days Remaining</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">{daysRemaining}</p>
            <p className="text-sm text-white/40">of {challengeDays} days ({daysUsed} used)</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-white/40">Total P/L</p>
            <p className={`mt-2 text-3xl font-bold ${totalPL >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${totalPL.toFixed(2)}
            </p>
            <p className="text-sm text-white/40">Target: ${profitTargetAmount.toFixed(0)}</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          <ProgressBar
            label="Profit Target"
            progress={profitProgress}
            color="green"
            description={`$${totalPL.toFixed(2)} / $${profitTargetAmount.toFixed(0)}`}
          />
          <ProgressBar
            label="Max Drawdown Used"
            progress={drawdownProgress}
            color="red"
            description={`$${Math.abs(Math.min(totalPL, 0)).toFixed(2)} / $${maxDrawdownAmount.toFixed(0)}`}
          />
          <ProgressBar
            label="Today's Drawdown"
            progress={dailyDrawdownProgress}
            color="orange"
            description={`$${Math.abs(Math.min(todayPL, 0)).toFixed(2)} / $${dailyDrawdownAmount.toFixed(0)}`}
          />
        </div>
      </div>
    </AppShell>
  );
}

function Setting({ label, value, onChange, editing }: {
  label: string; value: number; onChange: (v: number) => void; editing: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-white/40 mb-1">{label}</p>
      {editing ? (
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
          className="w-full rounded-2xl border border-white/10 bg-black/50 p-3 text-white outline-none focus:border-blue-500" />
      ) : (
        <p className="font-semibold">{value}</p>
      )}
    </div>
  );
}

function ProgressBar({ label, progress, color, description }: {
  label: string; progress: number; color: string; description: string;
}) {
  const colors: Record<string, string> = {
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
  };
  const textColors: Record<string, string> = {
    green: "text-green-400",
    red: "text-red-400",
    orange: "text-orange-400",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold">{label}</p>
        <p className={`text-sm font-bold ${textColors[color]}`}>{progress.toFixed(0)}%</p>
      </div>
      <div className="h-3 rounded-full bg-white/10">
        <div
          className={`h-3 rounded-full transition-all ${colors[color]}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-white/40">{description}</p>
    </div>
  );
}
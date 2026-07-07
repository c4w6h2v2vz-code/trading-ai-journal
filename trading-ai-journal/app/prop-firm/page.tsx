"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

export default function PropFirmPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Challenge settings
  const [accountSize, setAccountSize] = useState(10000);
  const [maxDrawdown, setMaxDrawdown] = useState(10);
  const [dailyDrawdown, setDailyDrawdown] = useState(5);
  const [profitTarget, setProfitTarget] = useState(10);
  const [challengeDays, setChallengeDays] = useState(30);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("prop-firm-settings");
    if (saved) {
      const s = JSON.parse(saved);
      setAccountSize(s.accountSize || 10000);
      setMaxDrawdown(s.maxDrawdown || 10);
      setDailyDrawdown(s.dailyDrawdown || 5);
      setProfitTarget(s.profitTarget || 10);
      setChallengeDays(s.challengeDays || 30);
      setStartDate(s.startDate || new Date().toISOString().slice(0, 10));
    }

    async function loadTrades() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: manual } = await supabase
        .from("trades")
        .select("profit_loss, created_at")
        .eq("user_id", user.id);

      const { data: mt5 } = await supabase
        .from("mt5_trades")
        .select("profit, created_at")
        .eq("user_id", user.id);

      const mt5Mapped = (mt5 || []).map(t => ({
        profit_loss: t.profit,
        created_at: t.created_at,
      }));

      setTrades([...(manual || []), ...mt5Mapped]);
      setLoading(false);
    }
    loadTrades();
  }, []);

  function saveSettings() {
    localStorage.setItem("prop-firm-settings", JSON.stringify({
      accountSize, maxDrawdown, dailyDrawdown, profitTarget, challengeDays, startDate
    }));
    setEditing(false);
  }

  // Calculations
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

  if (loading) return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="space-y-4">
          {[1,2,3].map(i => (
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
          <p className="mb-3 w-fit rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-sm text-orange-300">
            Prop Firm Tracker
          </p>
          <h1 className="text-4xl font-bold">Challenge Tracker</h1>
          <p className="mt-2 text-white/40">Track your FTMO or prop firm challenge progress.</p>
        </div>

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

        {isPassed && (
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
            <Setting label="Account Size ($)" value={accountSize} onChange={setAccountSize} editing={editing} />
            <Setting label="Max Drawdown (%)" value={maxDrawdown} onChange={setMaxDrawdown} editing={editing} />
            <Setting label="Daily Drawdown (%)" value={dailyDrawdown} onChange={setDailyDrawdown} editing={editing} />
            <Setting label="Profit Target (%)" value={profitTarget} onChange={setProfitTarget} editing={editing} />
            <Setting label="Challenge Days" value={challengeDays} onChange={setChallengeDays} editing={editing} />
            <div>
              <p className="text-sm text-white/40 mb-1">Start Date</p>
              {editing ? (
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/50 p-3 text-white outline-none focus:border-blue-500" />
              ) : (
                <p className="font-semibold">{startDate}</p>
              )}
            </div>
          </div>
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
            current={totalPL}
            target={profitTargetAmount}
            progress={profitProgress}
            color="green"
            description={`$${totalPL.toFixed(2)} / $${profitTargetAmount.toFixed(0)}`}
          />
          <ProgressBar
            label="Max Drawdown Used"
            current={Math.abs(Math.min(totalPL, 0))}
            target={maxDrawdownAmount}
            progress={drawdownProgress}
            color="red"
            description={`$${Math.abs(Math.min(totalPL, 0)).toFixed(2)} / $${maxDrawdownAmount.toFixed(0)}`}
          />
          <ProgressBar
            label="Today's Drawdown"
            current={Math.abs(Math.min(todayPL, 0))}
            target={dailyDrawdownAmount}
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

function ProgressBar({ label, current, target, progress, color, description }: {
  label: string; current: number; target: number; progress: number; color: string; description: string;
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
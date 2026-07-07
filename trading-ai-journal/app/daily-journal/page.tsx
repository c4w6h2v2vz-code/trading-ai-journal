"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type DailyEntry = {
  id?: string;
  user_id?: string;
  date: string;
  morning_plan: string;
  pairs_to_watch: string;
  daily_loss_limit: number;
  mindset: string;
  evening_review: string;
  rules_followed: boolean;
  lessons: string;
  score: number;
  created_at?: string;
};

export default function DailyJournalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [entry, setEntry] = useState<DailyEntry>({
    date: new Date().toISOString().slice(0, 10),
    morning_plan: "",
    pairs_to_watch: "",
    daily_loss_limit: 0,
    mindset: "Calm",
    evening_review: "",
    rules_followed: true,
    lessons: "",
    score: 5,
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("daily_journal")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (data) setEntry(data);
      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = entry.id
      ? await supabase.from("daily_journal").update(entry).eq("id", entry.id)
      : await supabase.from("daily_journal").insert([{ ...entry, user_id: user.id }]);

    if (error) setMessage("Error saving: " + error.message);
    else setMessage("Saved ✅");

    setSaving(false);
  }

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
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            Daily Journal
          </p>
          <h1 className="text-4xl font-bold">Today's Journal</h1>
          <p className="mt-2 text-white/40">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-300">
            {message}
          </div>
        )}

        {/* Morning Plan */}
        <div className="mb-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
          <h2 className="mb-4 text-xl font-semibold text-blue-400">☀️ Morning Plan</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/40">What's your plan for today?</label>
              <textarea
                value={entry.morning_plan}
                onChange={e => setEntry({ ...entry, morning_plan: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                placeholder="I will only trade A+ setups during London session..."
                rows={3}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/40">Pairs to watch today</label>
              <input
                value={entry.pairs_to_watch}
                onChange={e => setEntry({ ...entry, pairs_to_watch: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                placeholder="EURUSD, GBPUSD, XAUUSD"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/40">Daily loss limit ($)</label>
              <input
                type="number"
                value={entry.daily_loss_limit}
                onChange={e => setEntry({ ...entry, daily_loss_limit: Number(e.target.value) })}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                placeholder="100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/40">Morning mindset</label>
              <select
                value={entry.mindset}
                onChange={e => setEntry({ ...entry, mindset: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
              >
                {["Calm", "Confident", "Anxious", "Tired", "Focused", "Distracted", "Motivated"].map(m => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Evening Review */}
        <div className="mb-6 rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6">
          <h2 className="mb-4 text-xl font-semibold text-purple-400">🌙 Evening Review</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/40">How did your trading go today?</label>
              <textarea
                value={entry.evening_review}
                onChange={e => setEntry({ ...entry, evening_review: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                placeholder="I stuck to my plan, took 2 trades, both were A+ setups..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm text-white/40">Did you follow your trading rules?</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setEntry({ ...entry, rules_followed: true })}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${entry.rules_followed ? "bg-green-600 text-white" : "bg-white/10 text-white/40"}`}
                >
                  Yes ✅
                </button>
                <button
                  onClick={() => setEntry({ ...entry, rules_followed: false })}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${!entry.rules_followed ? "bg-red-600 text-white" : "bg-white/10 text-white/40"}`}
                >
                  No ❌
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/40">Lessons learned today</label>
              <textarea
                value={entry.lessons}
                onChange={e => setEntry({ ...entry, lessons: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                placeholder="I need to wait for confirmation before entering..."
                rows={2}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/40">
                Day score: <span className="text-white font-bold">{entry.score}/10</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={entry.score}
                onChange={e => setEntry({ ...entry, score: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/30">
                <span>1 - Terrible</span>
                <span>5 - Average</span>
                <span>10 - Perfect</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-2xl bg-blue-600 py-4 font-semibold transition hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Today's Journal"}
        </button>
      </div>
    </AppShell>
  );
}
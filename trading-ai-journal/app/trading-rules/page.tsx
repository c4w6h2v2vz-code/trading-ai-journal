"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type Rule = {
  id: string;
  title: string;
  description: string;
  created_at: string;
};

export default function TradingRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data } = await supabase
      .from("trading_rules")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    setRules(data || []);
    setLoading(false);
  }

  async function addRule() {
    if (!title.trim()) {
      setMessage("Please enter a rule title.");
      return;
    }
    setSaving(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("trading_rules")
      .insert([{ user_id: user.id, title, description }])
      .select()
      .single();

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setRules([...rules, data]);
      setTitle("");
      setDescription("");
      setShowForm(false);
      setMessage("Rule added ✅ AI will check every future trade against this.");
    }
    setSaving(false);
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this rule?")) return;
    await supabase.from("trading_rules").delete().eq("id", id);
    setRules(rules.filter(r => r.id !== id));
    setMessage("Rule deleted ✅");
  }

  const suggestedRules = [
    { title: "Never trade during high-impact news", description: "Avoid entering trades 15 minutes before or after high-impact economic releases." },
    { title: "Max 2 trades per day", description: "Do not open more than 2 new positions in a single trading day." },
    { title: "Always use 1:2 risk-reward minimum", description: "Every trade must target at least 2x the amount risked." },
    { title: "No revenge trading", description: "Never open a new trade immediately after a loss to 'win it back'." },
    { title: "Risk max 2% per trade", description: "Never risk more than 2% of account balance on a single trade." },
    { title: "Stop trading after 2 losses in a row", description: "If two consecutive trades lose, stop trading for the rest of the day." },
  ];

  async function addSuggested(rule: { title: string; description: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("trading_rules")
      .insert([{ user_id: user.id, title: rule.title, description: rule.description }])
      .select()
      .single();

    if (!error && data) {
      setRules([...rules, data]);
      setMessage(`Added "${rule.title}" ✅`);
    }
  }

  if (loading) return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 h-24 animate-pulse" />
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
            📋 Trading Rules
          </p>
          <h1 className="text-4xl font-bold">Your Trading Rules</h1>
          <p className="mt-2 text-white/40">
            Set your personal trading discipline rules. AI checks every trade against these and tells you when you break one.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-300">
            {message}
          </div>
        )}

        {/* Add Rule Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 w-full rounded-2xl bg-blue-600 py-3 font-semibold transition hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Add Custom Rule"}
        </button>

        {/* Add Rule Form */}
        {showForm && (
          <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="space-y-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Rule title, e.g. Never trade angry"
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
              />
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optional) - explain the rule in more detail"
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
              />
              <button
                onClick={addRule}
                disabled={saving}
                className="w-full rounded-2xl bg-green-600 py-3 font-semibold transition hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Rule"}
              </button>
            </div>
          </div>
        )}

        {/* Your Rules */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Your Rules ({rules.length})</h2>
          {rules.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-white/40">No rules yet. Add your first rule above, or pick a suggested one below.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{rule.title}</p>
                      {rule.description && (
                        <p className="mt-1 text-sm text-white/50">{rule.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="ml-3 shrink-0 rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Rules */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">💡 Suggested Rules</h2>
          <p className="mb-4 text-sm text-white/40">Popular discipline rules used by profitable traders. Tap to add.</p>
          <div className="space-y-3">
            {suggestedRules
              .filter(sr => !rules.some(r => r.title === sr.title))
              .map((rule, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div>
                    <p className="font-semibold text-sm">{rule.title}</p>
                    <p className="mt-1 text-xs text-white/40">{rule.description}</p>
                  </div>
                  <button
                    onClick={() => addSuggested(rule)}
                    className="ml-3 shrink-0 rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/20"
                  >
                    + Add
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
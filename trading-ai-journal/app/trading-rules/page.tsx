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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
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
    load();
  }, []);

  async function addRule() {
    if (!title.trim()) return;
    setSaving(true);

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
      setMessage("Rule added ✅");
    }
    setSaving(false);
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this rule?")) return;

    await supabase.from("trading_rules").delete().eq("id", id);
    setRules(rules.filter(r => r.id !== id));
    setMessage("Rule deleted ✅");
  }

  if (loading) return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="space-y-4">
          {[1,2,3].map(i => (
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
          <p className="mb-3 w-fit rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1 text-sm text-yellow-300">
            Trading Rules
          </p>
          <h1 className="text-4xl font-bold">My Trading Rules</h1>
          <p className="mt-2 text-white/40">
            These rules are checked by AI on every trade you take.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-300">
            {message}
          </div>
        )}

        {/* Add Rule Form */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-xl font-semibold">Add New Rule</h2>
          <div className="space-y-4">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Rule title e.g. Only trade A+ setups"
              className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-yellow-500"
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the rule in detail..."
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-yellow-500"
            />
            <button
              onClick={addRule}
              disabled={saving || !title.trim()}
              className="w-full rounded-2xl bg-yellow-600 py-4 font-semibold transition hover:bg-yellow-700 disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Rule"}
            </button>
          </div>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">My Rules ({rules.length})</h2>

          {rules.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
              <p className="text-4xl mb-4">📋</p>
              <p className="text-white/40">No rules yet. Add your first trading rule above.</p>
              <p className="mt-2 text-sm text-white/20">Example: "Only trade during London session", "Always use 1:2 RR", "No trading after 2 losses"</p>
            </div>
          ) : (
            rules.map((rule, index) => (
              <div key={rule.id} className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-bold text-yellow-400">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-yellow-300">{rule.title}</p>
                      {rule.description && (
                        <p className="mt-1 text-sm text-white/50">{rule.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="shrink-0 rounded-xl bg-red-500/10 px-3 py-1 text-xs text-red-400 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {rules.length > 0 && (
          <div className="mt-8 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
            <p className="text-sm font-semibold text-blue-400">🤖 AI Coach</p>
            <p className="mt-2 text-sm text-white/60">
              Every time you save a trade, AI checks all {rules.length} of your rules and tells you which ones you followed or broke.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
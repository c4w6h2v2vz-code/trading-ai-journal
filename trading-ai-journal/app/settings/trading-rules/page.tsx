"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type Rule = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
};

export default function TradingRulesPage() {
  const router = useRouter();

  const [rules, setRules] = useState<Rule[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return null;
    }

    return user;
  }

  async function loadRules() {
    const user = await getCurrentUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("trading_rules")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      setMessage("Error loading rules: " + error.message);
    } else {
      setRules(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function addRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const user = await getCurrentUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("trading_rules")
      .insert([
        {
          user_id: user.id,
          title,
          description,
        },
      ])
      .select()
      .single();

    if (error) {
      setMessage("Error saving rule: " + error.message);
    } else {
      setRules((oldRules) => [...oldRules, data]);
      setTitle("");
      setDescription("");
      setMessage("Rule saved successfully ✅");
    }

    setSaving(false);
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this trading rule?")) return;

    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabase
      .from("trading_rules")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setMessage("Error deleting rule: " + error.message);
    } else {
      setRules((oldRules) => oldRules.filter((rule) => rule.id !== id));
      setMessage("Rule deleted ✅");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
          Personal Trading System
        </p>

        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          My Trading Rules
        </h1>

        <p className="mt-3 text-white/50">
          These rules will later be used by your AI coach to judge every trade.
        </p>

        {message && (
          <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-300">
            {message}
          </div>
        )}

        <form
          onSubmit={addRule}
          className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/30"
        >
          <h2 className="mb-4 text-2xl font-semibold">Add New Rule</h2>

          <div className="grid gap-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Rule title e.g. Minimum 1:2 Risk Reward"
              className="rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Rule description..."
              rows={4}
              className="rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-blue-600 py-4 font-semibold transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Rule"}
            </button>
          </div>
        </form>

        <div className="mt-8 space-y-4">
          {loading ? (
            <p className="text-white/40">Loading rules...</p>
          ) : rules.length === 0 ? (
            <p className="text-white/40">No rules saved yet.</p>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{rule.title}</h2>
                    <p className="mt-2 text-white/50">{rule.description}</p>
                  </div>

                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
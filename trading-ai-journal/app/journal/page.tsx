"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";
import TradeForm from "@/components/journal/TradeForm";
import TradeHistory from "@/components/journal/TradeHistory";

type Trade = {
  id: string;
  user_id: string;
  pair: string;
  session: string;
  strategy: string | null;
  direction: string | null;
  grade: string | null;
  emotion: string | null;
  mistake: string | null;
  risk_reward: number | null;
  entry_price: number;
  exit_price: number;
  profit_loss: number;
  result: string;
  notes: string;
  image_url: string | null;
  created_at: string;
};

export default function JournalPage() {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [pairFilter, setPairFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("All");
  const [strategyFilter, setStrategyFilter] = useState("All");
  const [gradeFilter, setGradeFilter] = useState("All");

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

  async function loadTrades() {
    const user = await getCurrentUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Error loading trades: " + error.message);
    } else {
      setTrades(data || []);
    }
  }

  useEffect(() => {
    loadTrades();
  }, []);

  async function saveTrade(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const user = await getCurrentUser();
      if (!user) return;

      const form = event.currentTarget;
      const formData = new FormData(form);

      let imageUrl = editingTrade?.image_url || "";

      if (image) {
        const fileName = `${user.id}/${Date.now()}-${image.name}`;

        const { error: uploadError } = await supabase.storage
          .from("trade-screenshots")
          .upload(fileName, image);

        if (uploadError) {
          setMessage("Image upload error: " + uploadError.message);
          alert("Image upload error: " + uploadError.message);
          return;
        }

        imageUrl = supabase.storage
          .from("trade-screenshots")
          .getPublicUrl(fileName).data.publicUrl;
      }

      const tradeData = {
        user_id: user.id,
        pair: String(formData.get("pair") || ""),
        session: String(formData.get("session") || ""),
        strategy: String(formData.get("strategy") || ""),
        direction: String(formData.get("direction") || ""),
        grade: String(formData.get("grade") || ""),
        emotion: String(formData.get("emotion") || ""),
        mistake: String(formData.get("mistake") || ""),
        risk_reward: Number(formData.get("risk_reward") || 0),
        entry_price: Number(formData.get("entry_price") || 0),
        exit_price: Number(formData.get("exit_price") || 0),
        profit_loss: Number(formData.get("profit_loss") || 0),
        result: String(formData.get("result") || "Win"),
        notes: String(formData.get("notes") || ""),
        image_url: imageUrl,
      };

      const { data, error } = editingTrade
        ? await supabase
            .from("trades")
            .update(tradeData)
            .eq("id", editingTrade.id)
            .eq("user_id", user.id)
            .select()
            .single()
        : await supabase.from("trades").insert([tradeData]).select().single();

      if (error) {
        setMessage("Save error: " + error.message);
        alert("Save error: " + error.message);
        return;
      }

      if (editingTrade) {
        setTrades((oldTrades) =>
          oldTrades.map((trade) => (trade.id === data.id ? data : trade))
        );
        setMessage("Trade updated successfully ✅");
      } else {
        setTrades((oldTrades) => [data, ...oldTrades]);
        setMessage("Trade saved successfully ✅");
      }

      setEditingTrade(null);
      setImage(null);
      form.reset();
    } finally {
      setSaving(false);
    }
  }

  async function deleteTrade(id: string) {
    if (!confirm("Are you sure you want to delete this trade?")) return;

    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setMessage("Error deleting trade: " + error.message);
    } else {
      setTrades((oldTrades) => oldTrades.filter((trade) => trade.id !== id));
      setMessage("Trade deleted successfully ✅");
    }
  }

  const filteredTrades = trades.filter((trade) => {
    const matchesPair =
      pairFilter === "" ||
      trade.pair.toLowerCase().includes(pairFilter.toLowerCase());

    const matchesResult =
      resultFilter === "All" || trade.result === resultFilter;

    const matchesStrategy =
      strategyFilter === "All" || trade.strategy === strategyFilter;

    const matchesGrade =
      gradeFilter === "All" || trade.grade === gradeFilter;

    return matchesPair && matchesResult && matchesStrategy && matchesGrade;
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-10">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            Pro Trade Journal
          </p>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Trading Journal
          </h1>

          <p className="mt-3 text-white/50">
            Track strategy, direction, emotion, mistakes, grade, risk/reward,
            and screenshots.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-300">
            {message}
          </div>
        )}

        <TradeForm
          editingTrade={editingTrade}
          saving={saving}
          onSubmit={saveTrade}
          onCancelEdit={() => setEditingTrade(null)}
          onImageChange={setImage}
        />

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
          <h2 className="text-2xl font-semibold">Trade History</h2>

          <p className="mb-6 text-sm text-white/40">
            Your latest private trades and execution data.
          </p>

          <div className="mb-6 grid gap-3 md:grid-cols-4">
            <input
              value={pairFilter}
              onChange={(e) => setPairFilter(e.target.value)}
              placeholder="Search pair..."
              className="rounded-2xl border border-white/10 bg-black/50 p-3 text-white outline-none focus:border-blue-500"
            />

            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/50 p-3 text-white outline-none focus:border-blue-500"
            >
              <option>All</option>
              <option>Win</option>
              <option>Loss</option>
              <option>Break Even</option>
            </select>

            <select
              value={strategyFilter}
              onChange={(e) => setStrategyFilter(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/50 p-3 text-white outline-none focus:border-blue-500"
            >
              <option>All</option>
              <option>SMC</option>
              <option>Breakout</option>
              <option>Scalping</option>
            </select>

            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/50 p-3 text-white outline-none focus:border-blue-500"
            >
              <option>All</option>
              <option>A+</option>
              <option>A</option>
              <option>B</option>
              <option>C</option>
              <option>D</option>
            </select>
          </div>

          {trades.length === 0 ? (
            <p className="text-white/40">No trades saved yet.</p>
          ) : filteredTrades.length === 0 ? (
            <p className="text-white/40">No trades match your filters.</p>
          ) : (
            <TradeHistory
              trades={filteredTrades}
              onEdit={(trade) => setEditingTrade(trade as Trade)}
              onDelete={deleteTrade}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
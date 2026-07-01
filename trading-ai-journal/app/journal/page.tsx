"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

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

    if (error) setMessage("Error loading trades: " + error.message);
    else setTrades(data || []);
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

    const form = event.target as HTMLFormElement;
const formData = new FormData(form);
let imageUrl = editingTrade?.image_url || "";

if (image) {
  const fileName = `${user.id}/${Date.now()}-${image.name}`;

  const { error: uploadError } = await supabase.storage
    .from("trade-screenshots")
    .upload(fileName, image);

  if (uploadError) {
    alert("Image upload error: " + uploadError.message);
    setMessage("Image upload error: " + uploadError.message);
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
      
    };

    const { data, error } = editingTrade
      ? await supabase
          .from("trades")
          .update(tradeData)
          .eq("id", editingTrade.id)
          .eq("user_id", user.id)
          .select()
          .single()
      : await supabase
          .from("trades")
          .insert([tradeData])
          .select()
          .single();

    if (error) {
      alert("Save error: " + error.message);
      setMessage("Save error: " + error.message);
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
  } catch (err) {
  console.error(err);
  alert("Unexpected error: " + String(err));
  setMessage("Unexpected error: " + String(err));
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

        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
          <h2 className="mb-2 text-2xl font-semibold">
            {editingTrade ? "Edit Trade" : "Add New Trade"}
          </h2>

          <form onSubmit={saveTrade} className="mt-6 grid gap-4 md:grid-cols-2">
            <Input name="pair" placeholder="Pair e.g. EURUSD" defaultValue={editingTrade?.pair || ""} />
            <Select name="direction" defaultValue={editingTrade?.direction || "Buy"} options={["Buy", "Sell"]} />
            <Input name="strategy" placeholder="Strategy e.g. SMC, Breakout" defaultValue={editingTrade?.strategy || ""} />
            <Input name="session" placeholder="Session e.g. London" defaultValue={editingTrade?.session || ""} />
            <Input name="entry_price" placeholder="Entry price" defaultValue={editingTrade?.entry_price || ""} />
            <Input name="exit_price" placeholder="Exit price" defaultValue={editingTrade?.exit_price || ""} />
            <Input name="profit_loss" placeholder="Profit / Loss" defaultValue={editingTrade?.profit_loss || ""} />
            <Input name="risk_reward" placeholder="Risk Reward e.g. 2.5" defaultValue={editingTrade?.risk_reward || ""} />

            <Select name="result" defaultValue={editingTrade?.result || "Win"} options={["Win", "Loss", "Break Even"]} />
            <Select name="grade" defaultValue={editingTrade?.grade || "A"} options={["A+", "A", "B", "C", "D"]} />
            <Select name="emotion" defaultValue={editingTrade?.emotion || "Calm"} options={["Calm", "Confident", "Fear", "Greed", "FOMO", "Revenge"]} />
            <Input name="mistake" placeholder="Mistake e.g. Early entry" defaultValue={editingTrade?.mistake || ""} />

            <textarea
              name="notes"
              defaultValue={editingTrade?.notes || ""}
              className="md:col-span-2 rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
              placeholder="Trade notes, mistakes, psychology..."
              rows={5}
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="md:col-span-2 rounded-2xl border border-white/10 bg-black/50 p-4 text-white"
            />

            <button
  type="submit"
  onClick={() => alert("Button clicked")}
  disabled={saving}
  className="md:col-span-2 rounded-2xl bg-blue-600 py-4 font-semibold transition hover:bg-blue-700 disabled:opacity-50"
>
              Save Trade
            </button>

            {editingTrade && (
              <button
                type="button"
                onClick={() => setEditingTrade(null)}
                className="md:col-span-2 rounded-2xl bg-white/10 py-4 font-semibold transition hover:bg-white/20"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

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
            <div className="space-y-4">
              {filteredTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="grid gap-4 rounded-3xl border border-white/10 bg-black/40 p-4 transition hover:border-white/20 lg:grid-cols-[1fr_150px_220px]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold">{trade.pair}</h3>
                      <Badge text={trade.direction || "N/A"} />
                      <Badge text={trade.strategy || "No strategy"} />
                      <Badge text={trade.grade || "No grade"} />
                      <Badge text={trade.result} />
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-white/50 sm:grid-cols-3">
                      <p>Session: <span className="text-white">{trade.session}</span></p>
                      <p>Entry: <span className="text-white">{trade.entry_price}</span></p>
                      <p>Exit: <span className="text-white">{trade.exit_price}</span></p>
                      <p>P/L: <span className={trade.profit_loss >= 0 ? "text-green-400" : "text-red-400"}>{trade.profit_loss}</span></p>
                      <p>R:R: <span className="text-white">{trade.risk_reward || "N/A"}</span></p>
                      <p>Emotion: <span className="text-white">{trade.emotion || "N/A"}</span></p>
                    </div>

                    {trade.mistake && (
                      <p className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">
                        Mistake: {trade.mistake}
                      </p>
                    )}

                    {trade.notes && (
                      <p className="mt-4 rounded-2xl bg-white/[0.03] p-3 text-sm text-white/50">
                        {trade.notes}
                      </p>
                    )}
                  </div>

                  <div>
                    {trade.image_url ? (
                      <a href={trade.image_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={trade.image_url}
                          alt="Trade screenshot"
                          className="h-28 w-full rounded-2xl border border-white/10 object-cover hover:opacity-80"
                        />
                      </a>
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-white/30">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 lg:justify-end">
                    <button
                      onClick={() => router.push(`/journal/trade/${trade.id}`)}
                      className="rounded-xl bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400 hover:bg-blue-500/20"
                    >
                      View
                    </button>

                    <button
                      onClick={() => setEditingTrade(trade)}
                      className="rounded-xl bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-400 hover:bg-yellow-500/20"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteTrade(trade.id)}
                      className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Input({
  name,
  placeholder,
  defaultValue,
}: {
  name: string;
  placeholder: string;
  defaultValue: string | number;
}) {
  return (
    <input
      name={name}
      defaultValue={defaultValue}
      className="rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
      placeholder={placeholder}
    />
  );
}

function Select({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
      {text}
    </span>
  );
}
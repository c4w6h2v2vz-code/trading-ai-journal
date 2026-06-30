"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Trade = {
  id: string;
  pair: string;
  session: string;
  entry_price: number;
  exit_price: number;
  profit_loss: number;
  result: string;
  notes: string;
  image_url: string | null;
  created_at: string;
};

export default function JournalPage() {
  const [message, setMessage] = useState("");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [image, setImage] = useState<File | null>(null);

  async function loadTrades() {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setMessage("Error loading trades: " + error.message);
    else setTrades(data || []);
  }

  useEffect(() => {
    loadTrades();
  }, []);

  async function saveTrade(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    let imageUrl = editingTrade?.image_url || "";

    if (image) {
      const fileName = `${Date.now()}-${image.name}`;

      const { error: uploadError } = await supabase.storage
        .from("trade-screenshots")
        .upload(fileName, image);

      if (uploadError) {
        setMessage("Image upload error: " + uploadError.message);
        return;
      }

      imageUrl = supabase.storage
        .from("trade-screenshots")
        .getPublicUrl(fileName).data.publicUrl;
    }

    const tradeData = {
      pair: formData.get("pair"),
      session: formData.get("session"),
      entry_price: Number(formData.get("entry_price")),
      exit_price: Number(formData.get("exit_price")),
      profit_loss: Number(formData.get("profit_loss")),
      result: formData.get("result"),
      notes: formData.get("notes"),
      image_url: imageUrl,
    };

    const { error } = editingTrade
      ? await supabase.from("trades").update(tradeData).eq("id", editingTrade.id)
      : await supabase.from("trades").insert(tradeData);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage(editingTrade ? "Trade updated successfully ✅" : "Trade saved successfully ✅");
      setEditingTrade(null);
      setImage(null);
      event.currentTarget.reset();
      loadTrades();
    }
  }

  async function deleteTrade(id: string) {
    if (!confirm("Are you sure you want to delete this trade?")) return;

    const { error } = await supabase.from("trades").delete().eq("id", id);

    if (error) setMessage("Error deleting trade: " + error.message);
    else {
      setMessage("Trade deleted successfully ✅");
      loadTrades();
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-10">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            Trade Execution Journal
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Trading Journal
          </h1>
          <p className="mt-3 text-white/50">
            Log trades, screenshots, mistakes, psychology, and performance.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-300">
            {message}
          </div>
        )}

        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {editingTrade ? "Edit Trade" : "Add New Trade"}
              </h2>
              <p className="text-sm text-white/40">
                Record the trade details and attach a chart screenshot.
              </p>
            </div>
          </div>

          <form onSubmit={saveTrade} className="grid gap-4 md:grid-cols-2">
            <Input name="pair" placeholder="Pair e.g. EURUSD" defaultValue={editingTrade?.pair || ""} />
            <Input name="session" placeholder="Session e.g. London" defaultValue={editingTrade?.session || ""} />
            <Input name="entry_price" placeholder="Entry price" defaultValue={editingTrade?.entry_price || ""} />
            <Input name="exit_price" placeholder="Exit price" defaultValue={editingTrade?.exit_price || ""} />
            <Input name="profit_loss" placeholder="Profit / Loss" defaultValue={editingTrade?.profit_loss || ""} />

            <select
              name="result"
              defaultValue={editingTrade?.result || "Win"}
              className="rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
            >
              <option>Win</option>
              <option>Loss</option>
              <option>Break Even</option>
            </select>

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
              className="md:col-span-2 rounded-2xl bg-blue-600 py-4 font-semibold transition hover:bg-blue-700"
            >
              {editingTrade ? "Update Trade" : "Save Trade"}
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
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Trade History</h2>
            <p className="text-sm text-white/40">
              Your latest trades, screenshots, and actions.
            </p>
          </div>

          {trades.length === 0 ? (
            <p className="text-white/40">No trades saved yet.</p>
          ) : (
            <div className="space-y-4">
              {trades.map((trade) => (
                <div
                  key={trade.id}
                  className="grid gap-4 rounded-3xl border border-white/10 bg-black/40 p-4 transition hover:border-white/20 lg:grid-cols-[1fr_140px_180px]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold">{trade.pair}</h3>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                        {trade.session}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          trade.result === "Win"
                            ? "bg-green-500/10 text-green-400"
                            : trade.result === "Loss"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {trade.result}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-white/50 sm:grid-cols-3">
                      <p>Entry: <span className="text-white">{trade.entry_price}</span></p>
                      <p>Exit: <span className="text-white">{trade.exit_price}</span></p>
                      <p>
                        P/L:{" "}
                        <span className={trade.profit_loss >= 0 ? "text-green-400" : "text-red-400"}>
                          {trade.profit_loss}
                        </span>
                      </p>
                    </div>

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
    </main>
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
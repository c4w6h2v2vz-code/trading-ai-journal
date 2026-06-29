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
  created_at: string;
};

export default function JournalPage() {
  const [message, setMessage] = useState("");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  async function loadTrades() {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
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

    const formData = new FormData(event.currentTarget);

    const tradeData = {
      pair: formData.get("pair"),
      session: formData.get("session"),
      entry_price: Number(formData.get("entry_price")),
      exit_price: Number(formData.get("exit_price")),
      profit_loss: Number(formData.get("profit_loss")),
      result: formData.get("result"),
      notes: formData.get("notes"),
    };

    const { error } = editingTrade
      ? await supabase.from("trades").update(tradeData).eq("id", editingTrade.id)
      : await supabase.from("trades").insert(tradeData);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage(editingTrade ? "Trade updated successfully ✅" : "Trade saved successfully ✅");
      setEditingTrade(null);
      event.currentTarget.reset();
      loadTrades();
    }
  }

  async function deleteTrade(id: string) {
    const confirmDelete = confirm("Are you sure you want to delete this trade?");

    if (!confirmDelete) return;

    const { error } = await supabase.from("trades").delete().eq("id", id);

    if (error) {
      setMessage("Error deleting trade: " + error.message);
    } else {
      setMessage("Trade deleted successfully ✅");
      loadTrades();
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-2">Trading Journal</h1>
        <p className="text-white/50 mb-8">
          Add your trades and review your performance.
        </p>

        {message && <p className="mb-4 text-green-400">{message}</p>}

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">
            {editingTrade ? "Edit Trade" : "Add New Trade"}
          </h2>

          <form onSubmit={saveTrade} className="grid gap-4 md:grid-cols-2">
            <input
              name="pair"
              defaultValue={editingTrade?.pair || ""}
              className="rounded-xl bg-black border border-white/10 p-3"
              placeholder="Pair e.g. EUR/USD"
            />

            <input
              name="session"
              defaultValue={editingTrade?.session || ""}
              className="rounded-xl bg-black border border-white/10 p-3"
              placeholder="Session e.g. London"
            />

            <input
              name="entry_price"
              defaultValue={editingTrade?.entry_price || ""}
              className="rounded-xl bg-black border border-white/10 p-3"
              placeholder="Entry price"
            />

            <input
              name="exit_price"
              defaultValue={editingTrade?.exit_price || ""}
              className="rounded-xl bg-black border border-white/10 p-3"
              placeholder="Exit price"
            />

            <input
              name="profit_loss"
              defaultValue={editingTrade?.profit_loss || ""}
              className="rounded-xl bg-black border border-white/10 p-3"
              placeholder="Profit / Loss"
            />

            <select
              name="result"
              defaultValue={editingTrade?.result || "Win"}
              className="rounded-xl bg-black border border-white/10 p-3"
            >
              <option>Win</option>
              <option>Loss</option>
              <option>Break Even</option>
            </select>

            <textarea
              name="notes"
              defaultValue={editingTrade?.notes || ""}
              className="md:col-span-2 rounded-xl bg-black border border-white/10 p-3"
              placeholder="Trade notes, mistake, psychology..."
              rows={5}
            />

            <button
              type="submit"
              className="md:col-span-2 rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-700"
            >
              {editingTrade ? "Update Trade" : "Save Trade"}
            </button>

            {editingTrade && (
              <button
                type="button"
                onClick={() => setEditingTrade(null)}
                className="md:col-span-2 rounded-xl bg-white/10 py-3 font-semibold hover:bg-white/20"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-semibold mb-6">Trade History</h2>

          {trades.length === 0 ? (
            <p className="text-white/50">No trades saved yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-white/50">
                  <tr>
                    <th className="p-3">Pair</th>
                    <th className="p-3">Session</th>
                    <th className="p-3">Entry</th>
                    <th className="p-3">Exit</th>
                    <th className="p-3">P/L</th>
                    <th className="p-3">Result</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-t border-white/10">
                      <td className="p-3">{trade.pair}</td>
                      <td className="p-3">{trade.session}</td>
                      <td className="p-3">{trade.entry_price}</td>
                      <td className="p-3">{trade.exit_price}</td>
                      <td className="p-3">{trade.profit_loss}</td>
                      <td className="p-3">{trade.result}</td>
                      <td className="p-3 text-white/60">{trade.notes}</td>
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => setEditingTrade(trade)}
                          className="rounded-lg bg-yellow-600 px-3 py-1 text-xs font-semibold hover:bg-yellow-700"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteTrade(trade.id)}
                          className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
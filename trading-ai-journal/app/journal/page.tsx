"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function JournalPage() {
  const [message, setMessage] = useState("");

  async function saveTrade(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const { error } = await supabase.from("trades").insert({
      pair: formData.get("pair"),
      session: formData.get("session"),
      entry_price: Number(formData.get("entry_price")),
      exit_price: Number(formData.get("exit_price")),
      profit_loss: Number(formData.get("profit_loss")),
      result: formData.get("result"),
      notes: formData.get("notes"),
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Trade saved successfully ✅");
      event.currentTarget.reset();
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold mb-2">Trading Journal</h1>
        <p className="text-white/50 mb-8">
          Add your trades and review your performance.
        </p>

        {message && <p className="mb-4 text-green-400">{message}</p>}

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-semibold mb-6">Add New Trade</h2>

          <form onSubmit={saveTrade} className="grid gap-4 md:grid-cols-2">
            <input name="pair" className="rounded-xl bg-black border border-white/10 p-3" placeholder="Pair e.g. EUR/USD" />
            <input name="session" className="rounded-xl bg-black border border-white/10 p-3" placeholder="Session e.g. London" />
            <input name="entry_price" className="rounded-xl bg-black border border-white/10 p-3" placeholder="Entry price" />
            <input name="exit_price" className="rounded-xl bg-black border border-white/10 p-3" placeholder="Exit price" />
            <input name="profit_loss" className="rounded-xl bg-black border border-white/10 p-3" placeholder="Profit / Loss" />

            <select name="result" className="rounded-xl bg-black border border-white/10 p-3">
              <option>Win</option>
              <option>Loss</option>
              <option>Break Even</option>
            </select>

            <textarea
              name="notes"
              className="md:col-span-2 rounded-xl bg-black border border-white/10 p-3"
              placeholder="Trade notes, mistake, psychology..."
              rows={5}
            />

            <button
  type="submit"
  className="md:col-span-2 rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-700"
>
 
              Save Trade
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

type Trade = {
  id: string;
  user_id: string;
  trade_source: string;
  trade_date: string | null;
  timeframe: string | null;
  pair: string;
  session: string | null;
  strategy: string | null;
  direction: string | null;
  grade: string | null;
  emotion: string | null;
  mistake: string | null;
  risk_reward: number | null;
  entry_price: number | null;
  exit_price: number | null;
  profit_loss: number;
  result: string;
  notes: string | null;
  image_url_before: string | null;
  image_url_after: string | null;
  created_at: string;
};

const emptyRow = {
  trade_date: new Date().toISOString().slice(0, 16),
  pair: "",
  direction: "Buy",
  session: "London",
  timeframe: "H1",
  entry_price: "",
  exit_price: "",
  risk_reward: "",
  profit_loss: "",
  result: "Win",
  grade: "A",
  notes: "",
};

export default function BacktestPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [row, setRow] = useState({ ...emptyRow });
  const [newBefore, setNewBefore] = useState<File | null>(null);
  const [newAfter, setNewAfter] = useState<File | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [pairFilter, setPairFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "pl" | "pair">("date");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .eq("trade_source", "Backtest")
      .order("trade_date", { ascending: false });

    if (error) setMessage("Load error: " + error.message);
    else setTrades(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addRow() {
    if (!row.pair.trim()) { setMessage("Enter a pair first."); return; }
    setSaving(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const entry = parseFloat(row.entry_price);
      const exit = parseFloat(row.exit_price);
      const rr = parseFloat(row.risk_reward);
      const pl = parseFloat(row.profit_loss);

      const tradeData = {
        user_id: user.id,
        trade_source: "Backtest",
        trade_date: row.trade_date ? new Date(row.trade_date).toISOString() : new Date().toISOString(),
        pair: row.pair.toUpperCase().trim(),
        direction: row.direction,
        session: row.session,
        timeframe: row.timeframe,
        entry_price: isNaN(entry) ? null : entry,
        exit_price: isNaN(exit) ? null : exit,
        risk_reward: isNaN(rr) ? null : rr,
        profit_loss: isNaN(pl) ? 0 : pl,
        result: row.result,
        grade: row.grade,
        notes: row.notes || "",
      };

      let beforeUrl = "";
      let afterUrl = "";
      if (newBefore) {
        const fn = `${user.id}/${Date.now()}-b-${newBefore.name}`;
        const { error: e1 } = await supabase.storage.from("trade-screenshots").upload(fn, newBefore);
        if (!e1) beforeUrl = supabase.storage.from("trade-screenshots").getPublicUrl(fn).data.publicUrl;
      }
      if (newAfter) {
        const fn = `${user.id}/${Date.now()}-a-${newAfter.name}`;
        const { error: e2 } = await supabase.storage.from("trade-screenshots").upload(fn, newAfter);
        if (!e2) afterUrl = supabase.storage.from("trade-screenshots").getPublicUrl(fn).data.publicUrl;
      }

      const fullTradeData = { ...tradeData, image_url_before: beforeUrl, image_url_after: afterUrl };

      const { data, error } = await supabase.from("trades").insert([fullTradeData]).select().single();
      if (error) { setMessage("Save error: " + error.message); setSaving(false); return; }

      setTrades(old => [data as Trade, ...old]);
      setRow({ ...emptyRow, pair: row.pair, direction: row.direction, session: row.session, timeframe: row.timeframe });
      setNewBefore(null);
      setNewAfter(null);
      setMessage("Trade added ✅");
    } catch (err) {
      setMessage("Error: " + String(err));
    } finally {
      setSaving(false);
    }
  }

  async function uploadRowImage(tradeId: string, file: File, which: "before" | "after") {
    setUploadingId(tradeId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("trade-screenshots").upload(fileName, file);
      if (upErr) { setMessage("Upload failed: " + upErr.message); return; }

      const url = supabase.storage.from("trade-screenshots").getPublicUrl(fileName).data.publicUrl;
      const column = which === "before" ? "image_url_before" : "image_url_after";

      const { error: updErr } = await supabase.from("trades").update({ [column]: url }).eq("id", tradeId).eq("user_id", user.id);
      if (updErr) { setMessage("Save failed: " + updErr.message); return; }

      setTrades(old => old.map(t => t.id === tradeId ? { ...t, [column]: url } : t));
      setMessage("Screenshot added ✅");
    } catch (err) {
      setMessage("Error: " + String(err));
    } finally {
      setUploadingId(null);
    }
  }

  async function deleteTrade(id: string) {
    if (!confirm("Delete this backtest trade?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("trades").delete().eq("id", id).eq("user_id", user.id);
    setTrades(old => old.filter(t => t.id !== id));
  }

  const filtered = trades
    .filter(t => pairFilter === "" || t.pair.toLowerCase().includes(pairFilter.toLowerCase()))
    .filter(t => resultFilter === "All" || t.result === resultFilter)
    .sort((a, b) => {
      if (sortBy === "pl") return b.profit_loss - a.profit_loss;
      if (sortBy === "pair") return a.pair.localeCompare(b.pair);
      return new Date(b.trade_date || b.created_at).getTime() - new Date(a.trade_date || a.created_at).getTime();
    });

  const n = trades.length;
  const wins = trades.filter(t => t.profit_loss > 0);
  const losses = trades.filter(t => t.profit_loss < 0);
  const totalPL = trades.reduce((s, t) => s + Number(t.profit_loss), 0);
  const winRate = n > 0 ? ((wins.length / n) * 100).toFixed(1) : "0";
  const grossWin = wins.reduce((s, t) => s + Number(t.profit_loss), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + Number(t.profit_loss), 0));
  const pf = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : (grossWin > 0 ? "∞" : "0");
  const expectancy = n > 0 ? (totalPL / n).toFixed(2) : "0";

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <p className="w-fit rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-sm text-purple-300">
              🧪 Backtest Lab
            </p>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-xs text-white/50">
              Table view
            </span>
          </div>
          <h1 className="text-4xl font-bold">Backtest Lab</h1>
          <p className="mt-2 text-white/40">
            Log backtests fast in a table. These stay separate from your live stats.
            Analyze the whole set in <button onClick={() => router.push("/edge-finder")} className="text-purple-400 underline">Edge Finder</button>.
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">{message}</div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatBox label="Trades" value={String(n)} />
          <StatBox label="Win Rate" value={`${winRate}%`} color={Number(winRate) >= 50 ? "text-green-400" : "text-red-400"} />
          <StatBox label="Total P/L" value={String(totalPL.toFixed(2))} color={totalPL >= 0 ? "text-green-400" : "text-red-400"} />
          <StatBox label="Expectancy" value={String(expectancy)} color={Number(expectancy) >= 0 ? "text-green-400" : "text-red-400"} />
          <StatBox label="Profit Factor" value={String(pf)} color="text-yellow-400" />
        </div>

        <div className="mb-6 rounded-3xl border border-purple-500/20 bg-purple-500/5 p-4">
          <p className="mb-3 text-sm font-semibold text-purple-300">➕ Add a trade</p>
          <div className="grid gap-2 md:grid-cols-6">
            <input type="datetime-local" value={row.trade_date} onChange={e => setRow({ ...row, trade_date: e.target.value })} className="rounded-xl border border-white/10 bg-black/50 p-2 text-xs text-white outline-none focus:border-purple-500" />
            <input placeholder="Pair" value={row.pair} onChange={e => setRow({ ...row, pair: e.target.value })} className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500" />
            <select value={row.direction} onChange={e => setRow({ ...row, direction: e.target.value })} className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500">
              <option>Buy</option><option>Sell</option>
            </select>
            <select value={row.session} onChange={e => setRow({ ...row, session: e.target.value })} className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500">
              <option>Asia</option><option>London</option><option>New York</option><option>London-NY Overlap</option>
            </select>
            <select value={row.timeframe} onChange={e => setRow({ ...row, timeframe: e.target.value })} className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500">
              <option>M1</option><option>M5</option><option>M15</option><option>M30</option><option>H1</option><option>H4</option><option>D1</option>
            </select>
            <select value={row.grade} onChange={e => setRow({ ...row, grade: e.target.value })} className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500">
              <option>A+</option><option>A</option><option>B</option><option>C</option><option>D</option>
            </select>
            <input type="number" step="any" placeholder="Entry" value={row.entry_price} onChange={e => setRow({ ...row, entry_price: e.target.value })} className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500" />
            <input type="number" step="any" placeholder="Exit" value={row.exit_price} onChange={e => setRow({ ...row, exit_price: e.target.value })} className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500" />
            <input type="number" step="any" placeholder="R:R" value={row.risk_reward} onChange={e => setRow({ ...row, risk_reward: e.target.value })} className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500" />
            <input type="number" step="any" placeholder="P/L" value={row.profit_loss} onChange={e => setRow({ ...row, profit_loss: e.target.value })} className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500" />
            <select value={row.result} onChange={e => setRow({ ...row, result: e.target.value })} className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500">
              <option>Win</option><option>Loss</option><option>Break Even</option>
            </select>
            <button onClick={addRow} disabled={saving} className="rounded-xl bg-purple-600 p-2 text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
              {saving ? "..." : "Add +"}
            </button>
          </div>
          <input placeholder="Notes (optional)" value={row.notes} onChange={e => setRow({ ...row, notes: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500" />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/30 p-2 text-xs text-white/40 hover:border-purple-500">
              {newBefore ? `✅ Before: ${newBefore.name.slice(0, 20)}` : "📸 Before screenshot (optional)"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setNewBefore(e.target.files?.[0] || null)} />
            </label>
            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/30 p-2 text-xs text-white/40 hover:border-purple-500">
              {newAfter ? `✅ After: ${newAfter.name.slice(0, 20)}` : "📸 After screenshot (optional)"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setNewAfter(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <input value={pairFilter} onChange={e => setPairFilter(e.target.value)} placeholder="Filter pair..." className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500" />
          <select value={resultFilter} onChange={e => setResultFilter(e.target.value)} className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500">
            <option>All</option><option>Win</option><option>Loss</option><option>Break Even</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500">
            <option value="date">Sort: Date</option>
            <option value="pl">Sort: P/L</option>
            <option value="pair">Sort: Pair</option>
          </select>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 h-40 animate-pulse" />
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <p className="text-4xl mb-3">🧪</p>
            <p className="text-white/40">No backtest trades yet. Add your first one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.04]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/40">
                  <th className="p-3">Date</th>
                  <th className="p-3">Pair</th>
                  <th className="p-3">Dir</th>
                  <th className="p-3">TF</th>
                  <th className="p-3">Session</th>
                  <th className="p-3">Entry</th>
                  <th className="p-3">Exit</th>
                  <th className="p-3">R:R</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3 text-right">P/L</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <>
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer" onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                      <td className="p-3 text-xs text-white/60">
                        {t.trade_date ? new Date(t.trade_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
                      </td>
                      <td className="p-3 font-semibold">{t.pair}</td>
                      <td className="p-3">
                        <span className={t.direction === "Buy" ? "text-green-400" : "text-red-400"}>{t.direction}</span>
                      </td>
                      <td className="p-3 text-white/50">{t.timeframe || "—"}</td>
                      <td className="p-3 text-white/50 text-xs">{t.session || "—"}</td>
                      <td className="p-3 text-white/50">{t.entry_price ?? "—"}</td>
                      <td className="p-3 text-white/50">{t.exit_price ?? "—"}</td>
                      <td className="p-3 text-white/50">{t.risk_reward ?? "—"}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{t.grade || "—"}</span>
                      </td>
                      <td className={`p-3 text-right font-bold ${t.profit_loss >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {t.profit_loss >= 0 ? "+" : ""}{t.profit_loss}
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={(e) => { e.stopPropagation(); deleteTrade(t.id); }} className="text-xs text-red-400 hover:text-red-300">✕</button>
                      </td>
                    </tr>
                    {expandedId === t.id && (
                      <tr key={t.id + "-exp"} className="border-b border-white/5 bg-black/30">
                        <td colSpan={11} className="p-4">
                          {t.notes && <p className="mb-3 text-sm text-white/60">📝 {t.notes}</p>}
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="mb-1 text-xs text-white/40">Before entry</p>
                              {t.image_url_before ? (
                                <a href={t.image_url_before} target="_blank" rel="noopener noreferrer">
                                  <img src={t.image_url_before} alt="Before" className="h-40 w-full rounded-xl border border-white/10 object-cover hover:opacity-80" />
                                </a>
                              ) : (
                                <label className="flex h-40 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/30 text-xs text-white/40 hover:border-purple-500">
                                  {uploadingId === t.id ? "Uploading..." : "📸 Click to upload before"}
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadRowImage(t.id, f, "before"); }} />
                                </label>
                              )}
                            </div>
                            <div>
                              <p className="mb-1 text-xs text-white/40">After exit</p>
                              {t.image_url_after ? (
                                <a href={t.image_url_after} target="_blank" rel="noopener noreferrer">
                                  <img src={t.image_url_after} alt="After" className="h-40 w-full rounded-xl border border-white/10 object-cover hover:opacity-80" />
                                </a>
                              ) : (
                                <label className="flex h-40 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/30 text-xs text-white/40 hover:border-purple-500">
                                  {uploadingId === t.id ? "Uploading..." : "📸 Click to upload after"}
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadRowImage(t.id, f, "after"); }} />
                                </label>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
      <p className="text-xs text-white/40">{label}</p>
      <p className={`mt-1 text-lg font-bold ${color || "text-white"}`}>{value}</p>
    </div>
  );
}
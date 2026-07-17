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
  image_url_before: string | null;
  image_url_after: string | null;
  created_at: string;
  ai_score: number | null;
  ai_risk_score: number | null;
  ai_psychology_score: number | null;
  ai_execution_score: number | null;
  ai_feedback: string | null;
};

type MT5Trade = {
  id: number;
  ticket: number;
  account: string;
  server: string;
  symbol: string;
  trade_type: string;
  lot_size: number;
  entry_price: number;
  exit_price: number;
  profit: number;
  open_time: string;
  close_time: string;
  ai_score: number | null;
  ai_feedback: string | null;
};

export default function JournalPage() {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [mt5Trades, setMt5Trades] = useState<MT5Trade[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [imageBefore, setImageBefore] = useState<File | null>(null);
  const [imageAfter, setImageAfter] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pairFilter, setPairFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("All");
  const [strategyFilter, setStrategyFilter] = useState("All");
  const [gradeFilter, setGradeFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return null; }
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
    setLoading(false);
  }

  async function loadMt5Trades() {
    const user = await getCurrentUser();
    if (!user) return;

    const activeAccount = localStorage.getItem("active_account");
    const activeAccountNumber = activeAccount ? JSON.parse(activeAccount).account_number : null;

    let query = supabase.from("mt5_trades").select("*").eq("user_id", user.id);
    if (activeAccountNumber) query = query.eq("account", activeAccountNumber);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) setMessage("Error loading imported trades: " + error.message);
    else setMt5Trades(data || []);
  }

  useEffect(() => {
    loadTrades();
    loadMt5Trades();
  }, []);

  async function uploadImage(file: File, userId: string) {
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
    const { error } = await supabase.storage.from("trade-screenshots").upload(fileName, file);
    if (error) throw new Error("Image upload failed: " + error.message);
    return supabase.storage.from("trade-screenshots").getPublicUrl(fileName).data.publicUrl;
  }

  async function saveTrade(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const user = await getCurrentUser();
      if (!user) return;

      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);

      let beforeUrl = editingTrade?.image_url_before || "";
      let afterUrl = editingTrade?.image_url_after || "";

      if (imageBefore) beforeUrl = await uploadImage(imageBefore, user.id);
      if (imageAfter) afterUrl = await uploadImage(imageAfter, user.id);

      const dateInput = String(formData.get("trade_date") || "");
      const tradeDate = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

      const tradeData = {
        user_id: user.id,
        trade_source: String(formData.get("trade_source") || "Live"),
        trade_date: tradeDate,
        timeframe: String(formData.get("timeframe") || ""),
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
        image_url_before: beforeUrl,
        image_url_after: afterUrl,
        image_url: beforeUrl,
      };

      const { data, error } = editingTrade
        ? await supabase.from("trades").update(tradeData).eq("id", editingTrade.id).eq("user_id", user.id).select().single()
        : await supabase.from("trades").insert([tradeData]).select().single();

      if (error) {
        setMessage("Save error: " + error.message);
        setSaving(false);
        return;
      }

      let finalTrade = data as Trade;

      try {
        setMessage("Trade saved. Generating AI review...");

        const { data: tradingRules } = await supabase
          .from("trading_rules")
          .select("title, description")
          .eq("user_id", user.id);

        let imageBase64 = null;
        if (imageBefore) {
          const reader = new FileReader();
          imageBase64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.readAsDataURL(imageBefore);
          });
        }

        const aiResponse = await fetch("/api/ai-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trade: { ...finalTrade, trading_rules: tradingRules || [] },
            history: trades.slice(0, 10),
            imageBase64,
          }),
        });

        const aiData = await aiResponse.json();

        if (aiResponse.status === 403) {
          setShowUpgradeModal(true);
          setMessage("Trade saved ✅ (AI review needs Pro — free limit reached)");
        } else if (!aiResponse.ok || aiData.error) {
          throw new Error(aiData.error || "AI failed");
        } else {
          const { data: updated } = await supabase
            .from("trades")
            .update({
              ai_score: aiData.ai_score,
              ai_risk_score: aiData.ai_risk_score,
              ai_psychology_score: aiData.ai_psychology_score,
              ai_execution_score: aiData.ai_execution_score,
              ai_feedback: aiData.ai_feedback,
            })
            .eq("id", finalTrade.id)
            .select()
            .single();
          if (updated) finalTrade = updated as Trade;
          setMessage("Trade saved with AI review ✅");
        }
      } catch (aiError) {
        console.error(aiError);
        setMessage("Trade saved ✅ AI review failed, but trade is safe.");
      }

      if (editingTrade) {
        setTrades(old => old.map(t => (t.id === finalTrade.id ? finalTrade : t)));
      } else {
        setTrades(old => [finalTrade, ...old]);
      }

      setEditingTrade(null);
      setImageBefore(null);
      setImageAfter(null);
      form.reset();
    } catch (err) {
      console.error(err);
      setMessage("Unexpected error: " + String(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteTrade(id: string) {
    if (!confirm("Delete this trade?")) return;
    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabase.from("trades").delete().eq("id", id).eq("user_id", user.id);
    if (error) setMessage("Error: " + error.message);
    else {
      setTrades(old => old.filter(t => t.id !== id));
      setMessage("Trade deleted ✅");
    }
  }

  async function reviewMt5WithAI(trade: MT5Trade) {
    setMessage("Sending to AI review...");
    try {
      const user = await getCurrentUser();
      const response = await fetch("/api/mt5-ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade: { ...trade, user_id: user?.id } }),
      });

      if (response.status === 403) {
        setShowUpgradeModal(true);
        setMessage("Upgrade to Pro for more AI reviews.");
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI review failed");
      setMessage("AI review complete ✅");
      loadMt5Trades();
    } catch (err) {
      setMessage("AI review error: " + String(err));
    }
  }

  const filteredTrades = trades.filter((t) => {
    const matchesPair = pairFilter === "" || t.pair.toLowerCase().includes(pairFilter.toLowerCase());
    const matchesResult = resultFilter === "All" || t.result === resultFilter;
    const matchesStrategy = strategyFilter === "All" || t.strategy === strategyFilter;
    const matchesGrade = gradeFilter === "All" || t.grade === gradeFilter;
    const matchesSource = sourceFilter === "All" || (t.trade_source || "Live") === sourceFilter;
    return matchesPair && matchesResult && matchesStrategy && matchesGrade && matchesSource;
  });

  if (loading) return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 h-40 animate-pulse" />
          ))}
        </div>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-10">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            Pro Trade Journal
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Trading Journal</h1>
          <p className="mt-3 text-white/50">
            Log live trades and backtests. Before/after screenshots, real trade dates, and AI review on every entry.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-300">
            {message}
          </div>
        )}

        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
            <div className="w-full max-w-md rounded-3xl border border-blue-500/30 bg-[#0a0a0a] p-8 text-center">
              <p className="text-4xl mb-4">🚀</p>
              <h2 className="text-2xl font-bold mb-2">Free AI reviews used up</h2>
              <p className="text-white/50 mb-6">Upgrade to Pro for unlimited AI reviews and screenshot analysis.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowUpgradeModal(false)} className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold hover:bg-white/10">
                  Later
                </button>
                <button onClick={() => router.push("/pricing")} className="flex-1 rounded-2xl bg-blue-600 py-3 font-semibold hover:bg-blue-700">
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Imported */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-semibold">Imported Trades</h2>
          <p className="mb-6 text-sm text-white/40">Auto-synced from MT4/MT5, or imported via CSV.</p>

          {mt5Trades.length === 0 ? (
            <p className="text-white/40">No trades imported yet.</p>
          ) : (
            <div className="space-y-4">
              {mt5Trades.map((trade) => (
                <div key={trade.id} className="rounded-3xl border border-white/10 bg-black/40 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold">{trade.symbol}</h3>
                    <Badge text={trade.trade_type || "N/A"} />
                    <Badge text={`Lot ${trade.lot_size}`} />
                    {trade.ai_score !== null && <Badge text={`AI ${trade.ai_score}`} />}
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-white/50 sm:grid-cols-3">
                    <p>Entry: <span className="text-white">{trade.entry_price}</span></p>
                    <p>Exit: <span className="text-white">{trade.exit_price}</span></p>
                    <p>P/L: <span className={trade.profit >= 0 ? "text-green-400" : "text-red-400"}>{trade.profit}</span></p>
                  </div>
                  {trade.ai_feedback && (
                    <p className="mt-4 rounded-2xl bg-blue-500/10 p-3 text-sm text-blue-300">AI: {trade.ai_feedback}</p>
                  )}
                  {trade.ai_score ? (
                    <button onClick={() => router.push(`/journal/mt5-trade/${trade.id}`)} className="mt-4 rounded-xl bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400 hover:bg-green-500/20">
                      AI Reviewed ✅
                    </button>
                  ) : (
                    <button onClick={() => reviewMt5WithAI(trade)} className="mt-4 rounded-xl bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400 hover:bg-blue-500/20">
                      Review with AI
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-2 text-2xl font-semibold">{editingTrade ? "Edit Trade" : "Add New Trade"}</h2>
          <p className="mb-6 text-sm text-white/40">
            For backtests, set the real trade date — otherwise your session and time analysis will be wrong.
          </p>

          <form key={editingTrade?.id || "new"} onSubmit={saveTrade} className="grid gap-4 md:grid-cols-2">
            <Field label="Trade type">
              <Select name="trade_source" defaultValue={editingTrade?.trade_source || "Live"} options={["Live", "Backtest", "Demo"]} />
            </Field>

            <Field label="When did this trade happen?">
              <input
                type="datetime-local"
                name="trade_date"
                defaultValue={editingTrade?.trade_date ? new Date(editingTrade.trade_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
              />
            </Field>

            <Field label="Pair">
              <Input name="pair" placeholder="e.g. EURUSD" defaultValue={editingTrade?.pair || ""} />
            </Field>

            <Field label="Timeframe">
              <Select name="timeframe" defaultValue={editingTrade?.timeframe || "H1"} options={["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"]} />
            </Field>

            <Field label="Direction">
              <Select name="direction" defaultValue={editingTrade?.direction || "Buy"} options={["Buy", "Sell"]} />
            </Field>

            <Field label="Session">
              <Select name="session" defaultValue={editingTrade?.session || "London"} options={["Asia", "London", "New York", "London-NY Overlap", "Other"]} />
            </Field>

            <Field label="Strategy">
              <Input name="strategy" placeholder="e.g. SMC, Breakout" defaultValue={editingTrade?.strategy || ""} />
            </Field>

            <Field label="Risk : Reward planned">
              <Input name="risk_reward" placeholder="e.g. 2.5" defaultValue={editingTrade?.risk_reward || ""} />
            </Field>

            <Field label="Entry price">
              <Input name="entry_price" placeholder="Entry" defaultValue={editingTrade?.entry_price || ""} />
            </Field>

            <Field label="Exit price">
              <Input name="exit_price" placeholder="Exit" defaultValue={editingTrade?.exit_price || ""} />
            </Field>

            <Field label="Profit / Loss">
              <Input name="profit_loss" placeholder="e.g. 150 or -80" defaultValue={editingTrade?.profit_loss || ""} />
            </Field>

            <Field label="Result">
              <Select name="result" defaultValue={editingTrade?.result || "Win"} options={["Win", "Loss", "Break Even"]} />
            </Field>

            <Field label="Grade">
              <Select name="grade" defaultValue={editingTrade?.grade || "A"} options={["A+", "A", "B", "C", "D"]} />
            </Field>

            <Field label="Emotion">
              <Select name="emotion" defaultValue={editingTrade?.emotion || "Calm"} options={["Calm", "Confident", "Fear", "Greed", "FOMO", "Revenge", "Impatient"]} />
            </Field>

            <Field label="Mistake (if any)">
              <Input name="mistake" placeholder="e.g. Early entry" defaultValue={editingTrade?.mistake || ""} />
            </Field>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-white/50">Notes</label>
              <textarea
                name="notes"
                defaultValue={editingTrade?.notes || ""}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
                placeholder="What was your reasoning? What did you see?"
                rows={4}
              />
            </div>

            <Field label="📸 Before entry screenshot">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageBefore(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-3 text-sm text-white"
              />
              {editingTrade?.image_url_before && !imageBefore && (
                <p className="mt-1 text-xs text-white/30">Current image kept unless you pick a new one</p>
              )}
            </Field>

            <Field label="📸 After exit screenshot">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageAfter(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-3 text-sm text-white"
              />
              {editingTrade?.image_url_after && !imageAfter && (
                <p className="mt-1 text-xs text-white/30">Current image kept unless you pick a new one</p>
              )}
            </Field>

            <button
              type="submit"
              disabled={saving}
              className="md:col-span-2 rounded-2xl bg-blue-600 py-4 font-semibold transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving + AI review..." : editingTrade ? "Update Trade" : "Save Trade"}
            </button>

            {editingTrade && (
              <button
                type="button"
                onClick={() => { setEditingTrade(null); setImageBefore(null); setImageAfter(null); }}
                className="md:col-span-2 rounded-2xl bg-white/10 py-4 font-semibold hover:bg-white/20"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* History */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-semibold">Trade History</h2>
          <p className="mb-6 text-sm text-white/40">{filteredTrades.length} of {trades.length} trades shown</p>

          <div className="mb-6 grid gap-3 md:grid-cols-5">
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="rounded-2xl border border-white/10 bg-black/50 p-3 text-white outline-none focus:border-blue-500">
              <option>All</option><option>Live</option><option>Backtest</option><option>Demo</option>
            </select>
            <input value={pairFilter} onChange={(e) => setPairFilter(e.target.value)} placeholder="Search pair..." className="rounded-2xl border border-white/10 bg-black/50 p-3 text-white outline-none focus:border-blue-500" />
            <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="rounded-2xl border border-white/10 bg-black/50 p-3 text-white outline-none focus:border-blue-500">
              <option>All</option><option>Win</option><option>Loss</option><option>Break Even</option>
            </select>
            <select value={strategyFilter} onChange={(e) => setStrategyFilter(e.target.value)} className="rounded-2xl border border-white/10 bg-black/50 p-3 text-white outline-none focus:border-blue-500">
              <option>All</option><option>SMC</option><option>Breakout</option><option>Scalping</option>
            </select>
            <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="rounded-2xl border border-white/10 bg-black/50 p-3 text-white outline-none focus:border-blue-500">
              <option>All</option><option>A+</option><option>A</option><option>B</option><option>C</option><option>D</option>
            </select>
          </div>

          {filteredTrades.length === 0 ? (
            <p className="text-white/40">No trades match your filters.</p>
          ) : (
            <div className="space-y-4">
              {filteredTrades.map((trade) => (
                <div key={trade.id} className="rounded-3xl border border-white/10 bg-black/40 p-4 transition hover:border-white/20">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="text-xl font-bold">{trade.pair}</h3>
                    <Badge text={trade.direction || "N/A"} />
                    <Badge text={trade.timeframe || "—"} />
                    <Badge text={trade.strategy || "No strategy"} />
                    <Badge text={trade.grade || "No grade"} />
                    <Badge text={trade.result} />
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      trade.trade_source === "Backtest" ? "bg-purple-500/20 text-purple-400" :
                      trade.trade_source === "Demo" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-green-500/20 text-green-400"
                    }`}>{trade.trade_source || "Live"}</span>
                    <Badge text={`AI ${trade.ai_score ?? "N/A"}`} />
                  </div>

                  <p className="mb-3 text-xs text-white/30">
                    {trade.trade_date
                      ? new Date(trade.trade_date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Vienna" }) + " CET"
                      : "No date set"}
                  </p>

                  <div className="mb-3 grid gap-3 text-sm text-white/50 sm:grid-cols-3">
                    <p>Session: <span className="text-white">{trade.session}</span></p>
                    <p>Entry: <span className="text-white">{trade.entry_price}</span></p>
                    <p>Exit: <span className="text-white">{trade.exit_price}</span></p>
                    <p>P/L: <span className={trade.profit_loss >= 0 ? "text-green-400" : "text-red-400"}>{trade.profit_loss}</span></p>
                    <p>R:R: <span className="text-white">{trade.risk_reward || "N/A"}</span></p>
                    <p>Emotion: <span className="text-white">{trade.emotion || "N/A"}</span></p>
                  </div>

                  {(trade.image_url_before || trade.image_url_after) && (
                    <div className="mb-3 grid gap-3 sm:grid-cols-2">
                      {trade.image_url_before && (
                        <div>
                          <p className="mb-1 text-xs text-white/40">Before entry</p>
                          <a href={trade.image_url_before} target="_blank" rel="noopener noreferrer">
                            <img src={trade.image_url_before} alt="Before" className="h-40 w-full rounded-2xl border border-white/10 object-cover hover:opacity-80" />
                          </a>
                        </div>
                      )}
                      {trade.image_url_after && (
                        <div>
                          <p className="mb-1 text-xs text-white/40">After exit</p>
                          <a href={trade.image_url_after} target="_blank" rel="noopener noreferrer">
                            <img src={trade.image_url_after} alt="After" className="h-40 w-full rounded-2xl border border-white/10 object-cover hover:opacity-80" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {trade.ai_feedback && (
                    <p className="mb-3 rounded-2xl bg-blue-500/10 p-3 text-sm text-blue-300">AI: {trade.ai_feedback}</p>
                  )}

                  {trade.mistake && (
                    <p className="mb-3 rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">Mistake: {trade.mistake}</p>
                  )}

                  {trade.notes && (
                    <p className="mb-3 rounded-2xl bg-white/[0.03] p-3 text-sm text-white/50">{trade.notes}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => router.push(`/journal/trade/${trade.id}`)} className="rounded-xl bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400 hover:bg-blue-500/20">View</button>
                    <button onClick={() => { setEditingTrade(trade); window.scrollTo({ top: 400, behavior: "smooth" }); }} className="rounded-xl bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-400 hover:bg-yellow-500/20">Edit</button>
                    <button onClick={() => deleteTrade(trade.id)} className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20">Delete</button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-white/50">{label}</label>
      {children}
    </div>
  );
}

function Input({ name, placeholder, defaultValue }: { name: string; placeholder: string; defaultValue: string | number }) {
  return <input name={name} defaultValue={defaultValue} className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500" placeholder={placeholder} />;
}

function Select({ name, defaultValue, options }: { name: string; defaultValue: string; options: string[] }) {
  return (
    <select name={name} defaultValue={defaultValue} className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500">
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">{text}</span>;
}
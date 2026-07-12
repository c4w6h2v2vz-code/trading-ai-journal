"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type ParsedTrade = {
  ticket: string;
  symbol: string;
  trade_type: string;
  lot_size: number;
  entry_price: number;
  exit_price: number;
  profit: number;
  open_time: string;
  close_time: string;
};

export default function ImportPage() {
  const router = useRouter();
  const [platform, setPlatform] = useState("MT4");
  const [file, setFile] = useState<File | null>(null);
  const [trades, setTrades] = useState<ParsedTrade[]>([]);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);

  function parseCSV(text: string): ParsedTrade[] {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase();
    const parsed: ParsedTrade[] = [];

    if (platform === "MT4") {
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim().replace(/"/g, ""));
        if (cols.length < 8) continue;
        const ticket = cols[0];
        const openTime = cols[1];
        const type = cols[2];
        const lots = parseFloat(cols[3]) || 0;
        const symbol = cols[4];
        const openPrice = parseFloat(cols[5]) || 0;
        const closeTime = cols[6] || "";
        const closePrice = parseFloat(cols[7]) || 0;
        const profit = parseFloat(cols[cols.length - 1]) || 0;

        if (type === "buy" || type === "sell" || type === "Buy" || type === "Sell" || type === "BUY" || type === "SELL") {
          parsed.push({
            ticket,
            symbol,
            trade_type: type.toUpperCase(),
            lot_size: lots,
            entry_price: openPrice,
            exit_price: closePrice,
            profit,
            open_time: openTime,
            close_time: closeTime,
          });
        }
      }
    } else if (platform === "cTrader") {
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim().replace(/"/g, ""));
        if (cols.length < 7) continue;
        parsed.push({
          ticket: cols[0] || String(i),
          symbol: cols[1] || "",
          trade_type: (cols[2] || "").toUpperCase(),
          lot_size: parseFloat(cols[3]) || 0.01,
          entry_price: parseFloat(cols[4]) || 0,
          exit_price: parseFloat(cols[5]) || 0,
          profit: parseFloat(cols[6]) || 0,
          open_time: cols[7] || "",
          close_time: cols[8] || "",
        });
      }
    } else {
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim().replace(/"/g, ""));
        if (cols.length < 6) continue;

        let ticket = "", symbol = "", tradeType = "", lotSize = 0, entryPrice = 0, exitPrice = 0, profit = 0, openTime = "", closeTime = "";

        const headerCols = header.split(",").map(c => c.trim().replace(/"/g, ""));

        headerCols.forEach((h, idx) => {
          const val = cols[idx] || "";
          const hLower = h.toLowerCase();
          if (hLower.includes("ticket") || hLower.includes("order") || hLower.includes("id")) ticket = val;
          if (hLower.includes("symbol") || hLower.includes("pair") || hLower.includes("instrument")) symbol = val;
          if (hLower.includes("type") || hLower.includes("direction") || hLower.includes("side")) tradeType = val.toUpperCase();
          if (hLower.includes("lot") || hLower.includes("volume") || hLower.includes("size") || hLower.includes("quantity")) lotSize = parseFloat(val) || 0.01;
          if (hLower.includes("entry") || hLower.includes("open price") || hLower.includes("openprice")) entryPrice = parseFloat(val) || 0;
          if (hLower.includes("exit") || hLower.includes("close price") || hLower.includes("closeprice")) exitPrice = parseFloat(val) || 0;
          if (hLower.includes("profit") || hLower.includes("p/l") || hLower.includes("pnl") || hLower.includes("net")) profit = parseFloat(val) || 0;
          if (hLower.includes("open time") || hLower.includes("opentime") || hLower.includes("open date")) openTime = val;
          if (hLower.includes("close time") || hLower.includes("closetime") || hLower.includes("close date")) closeTime = val;
        });

        if (symbol && (tradeType === "BUY" || tradeType === "SELL")) {
          parsed.push({ ticket: ticket || String(i), symbol, trade_type: tradeType, lot_size: lotSize, entry_price: entryPrice, exit_price: exitPrice, profit, open_time: openTime, close_time: closeTime });
        }
      }
    }

    return parsed;
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const text = await f.text();
    const parsed = parseCSV(text);
    setTrades(parsed);
    setStep(2);
    setMessage(`Found ${parsed.length} trades in ${f.name}`);
  }

  async function importTrades() {
    if (trades.length === 0) return;
    setImporting(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const activeAccount = localStorage.getItem("active_account");
      const accountNumber = activeAccount ? JSON.parse(activeAccount).account_number : "imported";

      let imported = 0;
      let skipped = 0;

      for (const trade of trades) {
        const { data: existing } = await supabase
          .from("mt5_trades")
          .select("id")
          .eq("ticket", trade.ticket)
          .eq("user_id", user.id)
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        const { error } = await supabase
          .from("mt5_trades")
          .insert([{
            user_id: user.id,
            ticket: trade.ticket,
            account: accountNumber,
            server: platform,
            symbol: trade.symbol,
            trade_type: trade.trade_type,
            lot_size: trade.lot_size,
            entry_price: trade.entry_price,
            exit_price: trade.exit_price,
            profit: trade.profit,
            open_time: trade.open_time || null,
            close_time: trade.close_time || null,
          }]);

        if (!error) imported++;
      }

      setMessage(`✅ Imported ${imported} trades. Skipped ${skipped} duplicates.`);
      setStep(3);
    } catch (err) {
      setMessage("Error: " + String(err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            📂 Import Trades
          </p>
          <h1 className="text-4xl font-bold">Import Trade History</h1>
          <p className="mt-2 text-white/40">
            Upload your trade history from any platform. Supports MT4, MT5, cTrader, DXtrade, and any CSV format.
          </p>
        </div>

        {message && (
          <div className={`mb-6 rounded-2xl border px-5 py-4 ${
            message.startsWith("✅") ? "border-green-500/20 bg-green-500/10 text-green-300" :
            message.startsWith("Error") ? "border-red-500/20 bg-red-500/10 text-red-400" :
            "border-blue-500/20 bg-blue-500/10 text-blue-300"
          }`}>
            {message}
          </div>
        )}

        {/* Step 1 — Select Platform & Upload */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= 1 ? "bg-blue-600" : "bg-white/10"}`}>1</span>
            <h2 className="text-xl font-semibold">Select Platform & Upload File</h2>
          </div>

          <div className="mb-4">
            <label className="text-sm text-white/40 mb-2 block">Trading Platform</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
            >
              <option>MT4</option>
              <option>MT5</option>
              <option>cTrader</option>
              <option>DXtrade</option>
              <option>Match-Trader</option>
              <option>Other (Auto-detect)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="text-sm text-white/40 mb-2 block">Upload CSV File</label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFile}
              className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white/60 mb-2">📋 How to export your trades:</p>
            {platform === "MT4" && (
              <div className="text-xs text-white/40 space-y-1">
                <p>1. Open MT4 → Account History tab</p>
                <p>2. Right click → Select "All History"</p>
                <p>3. Right click again → "Save as Detailed Report"</p>
                <p>4. Save as .csv file and upload here</p>
              </div>
            )}
            {platform === "MT5" && (
              <div className="text-xs text-white/40 space-y-1">
                <p>1. Open MT5 → History tab</p>
                <p>2. Right click → Select period → "All History"</p>
                <p>3. Right click → "Export to CSV"</p>
                <p>4. Upload the file here</p>
              </div>
            )}
            {platform === "cTrader" && (
              <div className="text-xs text-white/40 space-y-1">
                <p>1. Open cTrader → History tab</p>
                <p>2. Set date range</p>
                <p>3. Click "Export" button</p>
                <p>4. Save as CSV and upload here</p>
              </div>
            )}
            {(platform === "DXtrade" || platform === "Match-Trader" || platform === "Other (Auto-detect)") && (
              <div className="text-xs text-white/40 space-y-1">
                <p>1. Export your trade history as CSV from your platform</p>
                <p>2. Make sure it includes: Symbol, Type, Entry Price, Exit Price, Profit</p>
                <p>3. Upload the file here — PipTrak will auto-detect the format</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 2 — Preview Trades */}
        {step >= 2 && trades.length > 0 && (
          <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">2</span>
              <h2 className="text-xl font-semibold">Preview ({trades.length} trades found)</h2>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {trades.map((trade, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      trade.trade_type === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>{trade.trade_type}</span>
                    <span className="font-semibold text-sm">{trade.symbol}</span>
                    <span className="text-xs text-white/40">Lot: {trade.lot_size}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${trade.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ${trade.profit.toFixed(2)}
                    </p>
                    <p className="text-xs text-white/30">{trade.entry_price} → {trade.exit_price}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3 mb-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-center">
                <p className="text-xs text-white/40">Total Trades</p>
                <p className="text-xl font-bold text-blue-400">{trades.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-center">
                <p className="text-xs text-white/40">Wins</p>
                <p className="text-xl font-bold text-green-400">{trades.filter(t => t.profit > 0).length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-center">
                <p className="text-xs text-white/40">Losses</p>
                <p className="text-xl font-bold text-red-400">{trades.filter(t => t.profit < 0).length}</p>
              </div>
            </div>

            <button
              onClick={importTrades}
              disabled={importing}
              className="w-full rounded-2xl bg-green-600 py-4 font-semibold transition hover:bg-green-700 disabled:opacity-50"
            >
              {importing ? "Importing trades..." : `✅ Import ${trades.length} Trades to PipTrak`}
            </button>
          </div>
        )}

        {/* Step 3 — Done */}
        {step >= 3 && (
          <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold">✓</span>
              <h2 className="text-xl font-semibold text-green-400">Import Complete!</h2>
            </div>
            <p className="text-white/60 mb-4">Your trades are now in PipTrak. View them in your dashboard and journal.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push("/journal")}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold hover:bg-white/10 transition"
              >
                View Journal
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
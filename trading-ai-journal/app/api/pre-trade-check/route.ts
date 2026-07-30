import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Warning = { level: "danger" | "caution" | "good"; message: string };

function sessionFromTime(iso: string): string {
  const hourStr = new Date(iso).toLocaleString("en-US", { hour: "2-digit", hour12: false, timeZone: "Europe/Vienna" });
  const h = parseInt(hourStr, 10);
  if (h >= 0 && h < 8) return "Asia";
  if (h >= 8 && h < 13) return "London";
  if (h >= 13 && h < 17) return "London-NY Overlap";
  if (h >= 17 && h < 22) return "New York";
  return "Asia";
}

function dayName(iso: string) {
  return new Date(iso).toLocaleString("en-US", { weekday: "long", timeZone: "Europe/Vienna" });
}

function statsFor(trades: any[]) {
  const n = trades.length;
  if (n === 0) return null;
  const wins = trades.filter(t => Number(t.pl) > 0);
  const totalPL = trades.reduce((s, t) => s + Number(t.pl), 0);
  return {
    n,
    winRate: (wins.length / n) * 100,
    totalPL,
  };
}

export async function POST(request: Request) {
  try {
    const { userId, accountNumber, pair, day, session, riskAmount } = await request.json();
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    // Load real trades (manual live + MT5)
    const { data: manual } = await supabase
      .from("trades")
      .select("pair, profit_loss, trade_date, created_at, session")
      .eq("user_id", userId)
      .eq("trade_source", "Live");

    let mt5Query = supabase
      .from("mt5_trades")
      .select("symbol, profit, close_time, created_at, account")
      .eq("user_id", userId);
    if (accountNumber) mt5Query = mt5Query.eq("account", String(accountNumber).trim());
    const { data: mt5 } = await mt5Query;

    const allTrades = [
      ...(manual || []).map((t: any) => ({
        pair: t.pair,
        pl: Number(t.profit_loss),
        date: t.trade_date || t.created_at,
        session: t.session,
      })),
      ...(mt5 || []).map((t: any) => ({
        pair: t.symbol,
        pl: Number(t.profit),
        date: t.close_time || t.created_at,
        session: t.close_time ? sessionFromTime(t.close_time) : null,
      })),
    ];

    const warnings: Warning[] = [];

    // --- Day check ---
    if (day) {
      const dayTrades = allTrades.filter(t => dayName(t.date) === day);
      const s = statsFor(dayTrades);
      if (s && s.n >= 3) {
        if (s.totalPL < 0) {
          warnings.push({
            level: "danger",
            message: `${day} is a losing day for you: ${s.totalPL.toFixed(2)} over ${s.n} trades (${s.winRate.toFixed(0)}% win rate).`,
          });
        } else {
          warnings.push({
            level: "good",
            message: `${day} has been positive: +${s.totalPL.toFixed(2)} over ${s.n} trades.`,
          });
        }
      }
    }

    // --- Pair check ---
    if (pair) {
      const pairTrades = allTrades.filter(t => (t.pair || "").toUpperCase() === pair.toUpperCase());
      const s = statsFor(pairTrades);
      if (s && s.n >= 3) {
        if (s.totalPL < 0) {
          warnings.push({
            level: "danger",
            message: `${pair} is a losing pair for you: ${s.totalPL.toFixed(2)} over ${s.n} trades (${s.winRate.toFixed(0)}% win rate).`,
          });
        } else {
          warnings.push({
            level: "good",
            message: `${pair} has been profitable: +${s.totalPL.toFixed(2)} over ${s.n} trades.`,
          });
        }
      } else {
        warnings.push({ level: "caution", message: `Only ${s?.n ?? 0} past trades on ${pair} — not enough history to judge this pair yet.` });
      }
    }

    // --- Session check ---
    if (session) {
      const sessTrades = allTrades.filter(t => t.session === session);
      const s = statsFor(sessTrades);
      if (s && s.n >= 3) {
        if (s.totalPL < 0) {
          warnings.push({
            level: "danger",
            message: `${session} session loses for you: ${s.totalPL.toFixed(2)} over ${s.n} trades.`,
          });
        } else {
          warnings.push({
            level: "good",
            message: `${session} session has been positive: +${s.totalPL.toFixed(2)} over ${s.n} trades.`,
          });
        }
      }
    }

    // --- Risk vs daily limit ---
    if (riskAmount && accountNumber) {
      const { data: acct } = await supabase
        .from("trading_accounts")
        .select("account_size, daily_loss_limit_percent, daily_drawdown_percent")
        .eq("user_id", userId)
        .eq("account_number", String(accountNumber).trim())
        .maybeSingle();

      if (acct && acct.account_size) {
        const limitPct = acct.daily_loss_limit_percent ?? acct.daily_drawdown_percent ?? null;
        if (limitPct) {
          const dailyLimit = (Number(acct.account_size) * Number(limitPct)) / 100;

          // How much lost already today
          const today = new Date().toDateString();
          const todayPL = allTrades
            .filter(t => new Date(t.date).toDateString() === today)
            .reduce((s, t) => s + t.pl, 0);
          const remaining = dailyLimit + todayPL; // todayPL negative if down

          if (Number(riskAmount) > remaining) {
            warnings.push({
              level: "danger",
              message: `This risk ($${Number(riskAmount).toFixed(2)}) exceeds your remaining daily loss room ($${remaining.toFixed(2)}). One loss could breach your daily limit.`,
            });
          } else if (Number(riskAmount) > dailyLimit * 0.5) {
            warnings.push({
              level: "caution",
              message: `This risk ($${Number(riskAmount).toFixed(2)}) is over half your daily limit ($${dailyLimit.toFixed(2)}). Two losses could end your day.`,
            });
          } else {
            warnings.push({
              level: "good",
              message: `Risk ($${Number(riskAmount).toFixed(2)}) is within a safe fraction of your daily limit ($${dailyLimit.toFixed(2)}).`,
            });
          }
        }
      }
    }

    const dangerCount = warnings.filter(w => w.level === "danger").length;
    let verdict = "clear";
    if (dangerCount >= 2) verdict = "high_risk";
    else if (dangerCount === 1) verdict = "caution";

    return NextResponse.json({
      verdict,
      warnings,
      totalTradesAnalyzed: allTrades.length,
      note: allTrades.length < 20
        ? "You have under 20 trades logged — these warnings are early signals, not proven patterns."
        : "Based on your real trade history.",
    });
  } catch (error) {
    console.error("Pre-trade check error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
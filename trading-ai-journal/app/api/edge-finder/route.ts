import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Trade = {
  pair: string;
  session: string | null;
  strategy: string | null;
  direction: string | null;
  grade: string | null;
  emotion: string | null;
  mistake: string | null;
  risk_reward: number | null;
  profit_loss: number;
  result: string;
  created_at: string;
  trade_date?: string | null;
  timeframe?: string | null;
};

function stats(trades: Trade[]) {
  const n = trades.length;
  if (n === 0) return null;

  const wins = trades.filter(t => Number(t.profit_loss) > 0);
  const losses = trades.filter(t => Number(t.profit_loss) < 0);
  const totalPL = trades.reduce((s, t) => s + Number(t.profit_loss), 0);
  const grossWin = wins.reduce((s, t) => s + Number(t.profit_loss), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + Number(t.profit_loss), 0));

  const winRate = (wins.length / n) * 100;
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const expectancy = totalPL / n;
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : (grossWin > 0 ? Infinity : 0);

  return {
    trades: n,
    win_rate: Number(winRate.toFixed(1)),
    total_pl: Number(totalPL.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    avg_win: Number(avgWin.toFixed(2)),
    avg_loss: Number(avgLoss.toFixed(2)),
    profit_factor: profitFactor === Infinity ? "∞" : Number(profitFactor.toFixed(2)),
    wins: wins.length,
    losses: losses.length,
  };
}

function groupBy(trades: Trade[], keyFn: (t: Trade) => string | null) {
  const groups: Record<string, Trade[]> = {};
  for (const t of trades) {
    const key = keyFn(t);
    if (!key || key === "null" || key.trim() === "") continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  return Object.entries(groups)
    .map(([key, ts]) => ({ key, ...stats(ts)! }))
    .sort((a, b) => b.total_pl - a.total_pl);
}

function hourCET(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { hour: "2-digit", hour12: false, timeZone: "Europe/Vienna" });
}

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

export async function POST(request: Request) {
  try {
    const { userId, accountNumber, source } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    let manualQuery = supabase
      .from("trades")
      .select("pair, session, strategy, direction, grade, emotion, mistake, risk_reward, profit_loss, result, created_at, trade_date, timeframe, trade_source")
      .eq("user_id", userId);

    if (source && source !== "All") {
      manualQuery = manualQuery.eq("trade_source", source);
    }

    const { data: manual } = await manualQuery;

    let mt5: any[] = [];
    if (!source || source === "All" || source === "Live") {
      let mt5Query = supabase
        .from("mt5_trades")
        .select("symbol, trade_type, profit, created_at, close_time, account")
        .eq("user_id", userId);

      if (accountNumber) mt5Query = mt5Query.eq("account", String(accountNumber).trim());

      const { data } = await mt5Query;
      mt5 = data || [];
    }

    const mt5Mapped: Trade[] = mt5.map((t: any) => ({
      pair: t.symbol,
      session: t.close_time ? sessionFromTime(t.close_time) : null,
      strategy: "MT5 Synced",
      direction: t.trade_type === "SELL" ? "Sell" : "Buy",
      grade: null,
      emotion: null,
      mistake: null,
      risk_reward: null,
      profit_loss: Number(t.profit),
      result: Number(t.profit) > 0 ? "Win" : Number(t.profit) < 0 ? "Loss" : "Break Even",
      created_at: t.created_at,
      trade_date: t.close_time || t.created_at,
      timeframe: null,
    }));

    const allTrades: Trade[] = [...((manual || []) as Trade[]), ...mt5Mapped];

    if (allTrades.length === 0) {
      return NextResponse.json({ error: "No trades found for this filter. Log or import trades first." }, { status: 400 });
    }

    const overall = stats(allTrades)!;

    const bySession = groupBy(allTrades, t => t.session);
    const byPair = groupBy(allTrades, t => t.pair);
    const byStrategy = groupBy(allTrades, t => t.strategy);
    const byEmotion = groupBy(allTrades, t => t.emotion);
    const byGrade = groupBy(allTrades, t => t.grade);
    const byDirection = groupBy(allTrades, t => t.direction);
    const byHour = groupBy(allTrades, t => hourCET(t.trade_date || t.created_at) + ":00 CET");
    const byDay = groupBy(allTrades, t => dayName(t.trade_date || t.created_at));
    const byTimeframe = groupBy(allTrades, t => t.timeframe || null);

    const mistakeGroups = groupBy(allTrades, t => t.mistake);
    const mistakeCost = mistakeGroups
      .filter(m => m.total_pl < 0)
      .sort((a, b) => a.total_pl - b.total_pl)
      .slice(0, 5);

    const withRR = allTrades.filter(t => t.risk_reward && Number(t.risk_reward) > 0);
    const avgPlannedRR = withRR.length
      ? Number((withRR.reduce((s, t) => s + Number(t.risk_reward), 0) / withRR.length).toFixed(2))
      : null;
    const actualRR = overall.avg_loss > 0
      ? Number((overall.avg_win / overall.avg_loss).toFixed(2))
      : null;

    const fmt = (label: string, rows: any[]) =>
      rows.length === 0 ? `${label}: no data` :
      `${label}:\n` + rows.map(r =>
        `  ${r.key} — ${r.trades} trades | Win rate ${r.win_rate}% | Total P/L ${r.total_pl} | Expectancy ${r.expectancy} | PF ${r.profit_factor}`
      ).join("\n");

    const dataText = `
DATA SOURCE FILTER: ${source || "All"}

OVERALL (${overall.trades} trades):
Win rate ${overall.win_rate}% | Total P/L ${overall.total_pl} | Expectancy ${overall.expectancy} per trade
Avg win ${overall.avg_win} | Avg loss ${overall.avg_loss} | Profit factor ${overall.profit_factor}
Wins ${overall.wins} | Losses ${overall.losses}

R:R REALITY:
Average planned R:R: ${avgPlannedRR ?? "not logged"}
Actual achieved R:R (avg win / avg loss): ${actualRR ?? "cannot calculate"}

${fmt("BY SESSION", bySession)}

${fmt("BY PAIR", byPair)}

${fmt("BY STRATEGY", byStrategy)}

${fmt("BY EMOTION", byEmotion)}

${fmt("BY GRADE", byGrade)}

${fmt("BY DIRECTION", byDirection)}

${fmt("BY HOUR (CET)", byHour)}

${fmt("BY DAY OF WEEK", byDay)}

${fmt("BY TIMEFRAME", byTimeframe)}

${mistakeCost.length > 0 ? "MOST COSTLY MISTAKES:\n" + mistakeCost.map(m => `  ${m.key} — ${m.trades} trades, cost ${m.total_pl}`).join("\n") : "MISTAKES: none logged"}
`.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a rigorous trading performance analyst inside PipTrak.

ABSOLUTE RULES:
1. Every number you cite MUST come from the data provided. Never invent a statistic.
2. SAMPLE SIZE IS CRITICAL. Any segment with fewer than 20 trades is NOT statistically meaningful — say so explicitly every time you mention it. Fewer than 10 trades is noise and must be labelled as such.
3. Never tell the user to automate or scale up a pattern found in a small sample. Warn them against it.
4. Be direct and honest. If the data shows they are losing money, say it plainly.
5. Never use the word "guaranteed". Never promise future results.
6. If the overall sample is under 30 trades, lead by saying the analysis is preliminary.
7. If the data source filter is "Backtest", note that backtest results measure the setup, not real trading psychology, since the trader knew no real money was at risk.
8. MT5-synced trades don't have emotion, grade, or planned R:R logged — if those breakdowns are sparse, note that the trader should log more detail manually.`,
          },
          {
            role: "user",
            content: `Analyze this trader's REAL trade data. Every number below is calculated from their actual database.

${dataText}

Return ONLY this JSON:
{
  "sample_warning": "If total trades < 30, a clear warning this is preliminary. If >= 100, say the sample is reasonably solid. Otherwise state the caveat honestly. Mention the source filter if it is Backtest or Demo.",
  "headline": "One blunt sentence summarizing their trading right now",
  "your_edge": {
    "finding": "The single strongest genuine pattern, citing real numbers AND its sample size",
    "sample_size": 0,
    "is_significant": true,
    "caveat": "If sample < 20, explain plainly why this may be noise"
  },
  "your_leak": {
    "finding": "The single biggest thing costing them money, citing real numbers AND sample size",
    "sample_size": 0,
    "cost": "The real P/L figure this leak represents",
    "fix": "One concrete action"
  },
  "stop_doing": ["2-3 specific things the data says they should stop, each citing a real number and sample size"],
  "rr_reality": "Compare planned R:R vs actually achieved. If they plan 1:2 but achieve 1:0.8, say plainly they are cutting winners or letting losers run.",
  "session_insight": "What the session data shows, with sample sizes. Say if samples are too small.",
  "pair_insight": "Which pairs genuinely make or lose money, with sample sizes",
  "time_insight": "Best/worst hours and days, explicitly warning that hour-of-day slicing usually creates tiny samples and false patterns",
  "psychology_insight": "What the emotion data shows, if logged. If not logged, say so and recommend logging it.",
  "next_steps": ["3 concrete, honest actions based on the real data"],
  "overfitting_warning": "A direct warning about the danger of over-interpreting small slices of this dataset"
}`
          }
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");
    const parsed = JSON.parse(jsonMatch[0]);

    parsed.overall = overall;
    parsed.by_session = bySession;
    parsed.by_pair = byPair;
    parsed.by_strategy = byStrategy;
    parsed.by_emotion = byEmotion;
    parsed.by_grade = byGrade;
    parsed.by_direction = byDirection;
    parsed.by_hour = byHour;
    parsed.by_day = byDay;
    parsed.by_timeframe = byTimeframe;
    parsed.mistake_cost = mistakeCost;
    parsed.avg_planned_rr = avgPlannedRR;
    parsed.actual_rr = actualRR;
    parsed.source_filter = source || "All";
    parsed.generated_at = new Date().toISOString();

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Edge Finder error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
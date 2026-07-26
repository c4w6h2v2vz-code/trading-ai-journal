import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TD_KEY = process.env.TWELVE_DATA_API_KEY;

type Pair = {
  name: string;
  symbol: string;      // Twelve Data symbol
  tdSymbol: string;
  price: string;
  change: string;
  changePercent: string;
  high: string;
  low: string;
  source: string;
  fetchedAt: string;
  available: boolean;
  note?: string;
};

function nowUTC() {
  return new Date().toISOString().slice(11, 16) + " UTC";
}

async function fetchPair(tdSymbol: string, displayName: string): Promise<Pair> {
  const base: Pair = {
    name: displayName,
    symbol: displayName,
    tdSymbol,
    price: "Unavailable",
    change: "—",
    changePercent: "—",
    high: "—",
    low: "—",
    source: "Twelve Data",
    fetchedAt: nowUTC(),
    available: false,
    note: "No data returned",
  };

  if (!TD_KEY) {
    base.note = "API key not configured";
    return base;
  }

  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(tdSymbol)}&apikey=${TD_KEY}`,
      { cache: "no-store" }
    );
    const data = await res.json();

    if (!data || data.status === "error" || !data.close) {
      base.note = data?.message ? String(data.message).slice(0, 120) : "No data returned";
      return base;
    }

    const decimals = tdSymbol.includes("JPY") ? 3 : tdSymbol.includes("XAU") ? 2 : (displayName.includes("US30") || displayName.includes("NAS")) ? 2 : 5;

    return {
      name: displayName,
      symbol: displayName,
      tdSymbol,
      price: Number(data.close).toFixed(decimals),
      change: data.change ? Number(data.change).toFixed(decimals) : "—",
      changePercent: data.percent_change ? Number(data.percent_change).toFixed(2) + "%" : "—",
      high: data.high ? Number(data.high).toFixed(decimals) : "—",
      low: data.low ? Number(data.low).toFixed(decimals) : "—",
      source: "Twelve Data",
      fetchedAt: nowUTC(),
      available: true,
    };
  } catch {
    base.note = "Fetch failed";
    return base;
  }
}

export async function POST() {
  try {
    const fetchedAt = new Date().toISOString();

    // Fetch sequentially would be safer for rate limits, but 5 symbols is within 8/min
    const [eurusd, gbpusd, xauusd, us30, nas100] = await Promise.all([
      fetchPair("EUR/USD", "EURUSD"),
      fetchPair("GBP/USD", "GBPUSD"),
      fetchPair("XAU/USD", "XAUUSD (Gold)"),
      fetchPair("DIA", "US30 proxy (DIA)"),
      fetchPair("QQQ", "NAS100 proxy (QQQ)"),
    ]);

    const pairs = [eurusd, gbpusd, xauusd, us30, nas100];
    const unavailable = pairs.filter(p => !p.available).map(p => `${p.name}: ${p.note}`);

    const pairsText = pairs.map(p =>
      p.available
        ? `${p.name}: price ${p.price} | change ${p.change} (${p.changePercent}) | day high ${p.high} | day low ${p.low} | source Twelve Data at ${p.fetchedAt}`
        : `${p.name}: UNAVAILABLE (${p.note}) — do not guess this value`
    ).join("\n");

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are PipTrak's market desk analyst for a forex and index trader.

ABSOLUTE RULES:
1. Use ONLY the numbers in the fact sheet. Never invent, estimate, or recall a price from memory.
2. If a pair is UNAVAILABLE, say so — never substitute a guessed value.
3. Never predict a specific future price. Describe what today's data shows.
4. Always cite Twelve Data as the source and note free-tier data may be delayed.
5. Be practical and concise — this is for a trader deciding what to watch today.
6. Never say "guaranteed". Never give financial advice framed as certainty.
7. For each pair, describe direction and where price sits between the day's high and low — that is real, useful context.`,
          },
          {
            role: "user",
            content: `Today's verified prices for the pairs this trader trades:

${pairsText}

Return ONLY this JSON:
{
  "overview": "One paragraph on the overall market tone today across these pairs, citing real numbers",
  "pairs": [
    {
      "name": "exact pair name from the fact sheet",
      "read": "What this pair is doing today using its real price/change/high/low. If unavailable, say so.",
      "position_in_range": "Where price sits between the day's low and high (near high, near low, mid-range), based only on the numbers given, or 'unavailable'"
    }
  ],
  "dollar_context": "What USD strength/weakness across EURUSD and GBPUSD implies today, citing real changes",
  "gold_context": "What gold (XAUUSD) is doing and how it relates to the dollar today, if both available",
  "indices_context": "What US30 and NAS100 proxies are showing today",
  "what_to_watch": ["2-4 concrete things to watch based only on the provided data"],
  "data_note": "One sentence noting the fetch time and that free-tier data may be delayed"
}

Include one object in "pairs" for EVERY pair in the fact sheet, in the same order.`
          }
        ],
      }),
    });

    const aiData = await aiRes.json();
    const text = aiData.choices?.[0]?.message?.content || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI returned no JSON");
    const parsed = JSON.parse(match[0]);

    return NextResponse.json({
      ...parsed,
      quotes: pairs,
      unavailable,
      fetched_at: fetchedAt,
      sources_used: ["Twelve Data"],
    });
  } catch (error) {
    console.error("Market Analysis error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
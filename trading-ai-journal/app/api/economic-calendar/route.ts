import { NextResponse } from "next/server";

export async function GET() {
  try {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);

    const response = await fetch(
      `https://nfs.faireconomy.media/ff_calendar_thisweek.json`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch calendar");
    }

    const data = await response.json();

    const todayEvents = data
      .filter((event: any) => {
        const eventDate = new Date(event.date).toISOString().slice(0, 10);
        return eventDate === dateStr;
      })
      .map((event: any) => ({
        time: new Date(event.date).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        currency: event.country,
        event: event.title,
        impact: event.impact === "High" ? "High" : event.impact === "Medium" ? "Medium" : "Low",
        forecast: event.forecast || "N/A",
        previous: event.previous || "N/A",
      }))
      .filter((e: any) => e.impact === "High" || e.impact === "Medium")
      .sort((a: any, b: any) => a.time.localeCompare(b.time));

    return NextResponse.json({ events: todayEvents, date: dateStr });
  } catch (error) {
    console.error("Calendar error:", error);
    return NextResponse.json({ events: [], error: String(error) });
  }
}
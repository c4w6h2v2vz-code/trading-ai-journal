"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/5 bg-black/80 px-6 py-4 backdrop-blur-xl">
        <span className="text-lg font-bold tracking-tight">PipTrak</span>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/login")} className="rounded-xl px-4 py-2 text-sm text-white/60 hover:text-white transition">
            Login
          </button>
          <button onClick={() => router.push("/register")} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition">
            Start Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
        <div className="mb-6 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300">
          Built for All Traders Worldwide
        </div>

        <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          The AI Trading System
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            That Trades For You
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-white/50 md:text-xl">
          PipTrak connects to your trading account, analyzes the market with AI, executes trades automatically, and closes everything when you hit your daily limit. The only trading journal that actually protects your account.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <button
            onClick={() => router.push("/register")}
            className="rounded-2xl bg-blue-600 px-8 py-4 text-lg font-semibold transition hover:bg-blue-700"
          >
            Start for Free →
          </button>
          <button
            onClick={() => router.push("/login")}
            className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold transition hover:bg-white/10"
          >
            Sign In
          </button>
        </div>

        <p className="mt-4 text-sm text-white/30">No credit card required · Free forever plan</p>

        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          <Stat number="AI" label="Auto trade execution" />
          <Stat number="3%" label="Daily loss protection" />
          <Stat number="MT5" label="Direct broker connection" />
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-center text-sm text-blue-400">Everything you need</p>
          <h2 className="mb-16 text-center text-4xl font-bold md:text-5xl">
            Built for serious traders
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="🤖"
              title="AI Trade Coach"
              description="Every trade gets an AI score, execution rating, psychology score, and personalized coaching feedback."
            />
            <FeatureCard
              icon="📸"
              title="Screenshot Analysis"
              description="Upload your TradingView chart. AI analyzes market structure, entry quality, stop loss, and risk/reward."
            />
            <FeatureCard
              icon="📊"
              title="Advanced Analytics"
              description="Win rate, profit factor, expectancy, best pairs, best sessions, drawdown, and more — all calculated automatically."
            />
            <FeatureCard
              icon="🧠"
              title="Psychology Tracking"
              description="AI detects revenge trading, FOMO, greed, and repeated mistakes. Get coached on your mental game."
            />
            <FeatureCard
              icon="🔗"
              title="MT5 Auto Import"
              description="Connect your FTMO MT5 account. Trades import automatically. No manual entry needed."
            />
            <FeatureCard
              icon="⚡"
              title="Auto Trade Execution"
              description="AI analyzes the market and executes trades automatically in MT5. Set your risk and let AI trade for you."
            />
            <FeatureCard
              icon="🛡️"
              title="Risk Guardian"
              description="Automatically closes all trades when you hit your daily loss or profit target. Never blow your account again."
            />
            <FeatureCard
              icon="📈"
              title="Weekly AI Reports"
              description="Every week, AI generates a full performance report with lessons, mistakes, and goals for next week."
            />
            <FeatureCard
              icon="🎯"
              title="Goals & Targets"
              description="Set daily, weekly, and monthly profit targets. AI tracks your progress and warns you when you're off track."
            />
            <FeatureCard
              icon="📅"
              title="Trade Calendar"
              description="See your performance mapped to a calendar. Identify your best and worst trading days instantly."
            />
            <FeatureCard
              icon="📰"
              title="AI Market Analysis"
              description="AI analyzes today's news events using 10 years of historical data and gives you trade probabilities."
            />
            <FeatureCard
              icon="🏦"
              title="Prop Firm Ready"
              description="Built for FTMO, MyForexFunds, FundedNext traders. Track drawdown, daily limits, and consistency rules."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-center text-sm text-purple-400">Simple process</p>
          <h2 className="mb-16 text-center text-4xl font-bold">How it works</h2>

          <div className="space-y-6">
            <Step number="1" title="Connect your MT5" description="Install our EA on MetaTrader 5. Trades sync automatically to PipTrak in real time." />
            <Step number="2" title="AI reviews every trade" description="Our AI scores your execution, risk management, and psychology. It checks your chart and trading rules." />
            <Step number="3" title="Get AI market analysis" description="Every day AI analyzes news events and gives you trade probabilities based on 10 years of historical data." />
            <Step number="4" title="Auto execute trades" description="Click one button and AI executes the trade plan in MT5 automatically with your risk settings." />
            <Step number="5" title="Risk Guardian protects you" description="Hit your daily loss limit? All trades close automatically. Your prop firm account stays safe." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-center text-sm text-green-400">Simple pricing</p>
          <h2 className="mb-4 text-center text-4xl font-bold">Start free. Scale when ready.</h2>
          <p className="mb-16 text-center text-white/40">No credit card required to start.</p>

          <div className="grid gap-6 md:grid-cols-3">
            <PricingCard
              name="Free"
              price="€0"
              period="forever"
              description="Perfect to get started"
              features={[
                "Manual trade journal",
                "Basic AI review",
                "Dashboard & analytics",
                "10 AI reviews/month",
              ]}
              cta="Start Free"
              onClick={() => router.push("/register")}
              highlighted={false}
            />
            <PricingCard
              name="Pro"
              price="€9.99"
              period="per month"
              description="For active traders"
              features={[
                "Everything in Free",
                "Unlimited AI reviews",
                "Screenshot AI analysis",
                "Weekly AI reports",
                "Psychology coaching",
                "Advanced analytics",
                "AI Market Analysis",
                "Daily Journal",
              ]}
              cta="Start Pro"
              onClick={() => router.push("/register")}
              highlighted={true}
            />
            <PricingCard
              name="Elite"
              price="€19.99"
              period="per month"
              description="For prop firm traders"
              features={[
                "Everything in Pro",
                "MT5 auto import",
                "Auto trade execution",
                "Risk Guardian",
                "Prop firm tracker",
                "Priority AI coaching",
                "Custom trading rules",
                "Monthly AI reports",
              ]}
              cta="Start Elite"
              onClick={() => router.push("/register")}
              highlighted={false}
            />
          </div>
        </div>
      </section>

      {/* vs competitors */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-16 text-center text-4xl font-bold">Why not TradeZella or Edgewonk?</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <CompareCard
              title="Others"
              points={[
                "Manual data entry only",
                "No chart screenshot AI",
                "No psychology coaching",
                "No MT5 auto import",
                "No auto trade execution",
                "No risk protection",
                "Expensive with no AI",
              ]}
              positive={false}
            />
            <CompareCard
              title="PipTrak"
              points={[
                "MT5 auto import",
                "Auto trade execution",
                "Risk Guardian protection",
                "Chart screenshot AI analysis",
                "Personal AI trading coach",
                "Psychology & emotion tracking",
                "AI Market Analysis with probabilities",
              ]}
              positive={true}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 px-6 py-24 text-center">
        <h2 className="mb-4 text-4xl font-bold md:text-5xl">
          Ready to trade smarter?
        </h2>
        <p className="mb-10 text-white/40 text-lg">
          Join traders already using AI to improve their performance.
        </p>
        <button
          onClick={() => router.push("/register")}
          className="rounded-2xl bg-blue-600 px-10 py-5 text-xl font-semibold transition hover:bg-blue-700"
        >
          Start for Free →
        </button>
        <p className="mt-4 text-sm text-white/30">Free forever plan · No credit card needed</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-white/20">
        <p>© 2026 PipTrak. Built for traders, by traders.</p>
      </footer>
    </main>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-4xl font-bold text-blue-400">{number}</p>
      <p className="mt-1 text-sm text-white/40">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.05]">
      <div className="mb-4 text-3xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-white/50">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold">
        {number}
      </div>
      <div>
        <h3 className="mb-1 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-white/50">{description}</p>
      </div>
    </div>
  );
}

function PricingCard({ name, price, period, description, features, cta, onClick, highlighted }: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  onClick: () => void;
  highlighted: boolean;
}) {
  return (
    <div className={`rounded-3xl border p-6 ${highlighted ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-white/[0.03]"}`}>
      <p className="text-sm text-white/40">{name}</p>
      <p className="mt-2 text-4xl font-bold">{price}</p>
      <p className="text-sm text-white/40">{period}</p>
      <p className="mt-2 text-sm text-white/60">{description}</p>
      <ul className="mt-6 space-y-3">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-white/70">
            <span className="text-green-400">✓</span> {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        className={`mt-8 w-full rounded-2xl py-3 font-semibold transition ${
          highlighted
            ? "bg-blue-600 hover:bg-blue-700"
            : "border border-white/10 bg-white/5 hover:bg-white/10"
        }`}
      >
        {cta}
      </button>
    </div>
  );
}

function CompareCard({ title, points, positive }: { title: string; points: string[]; positive: boolean }) {
  return (
    <div className={`rounded-3xl border p-6 ${positive ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
      <h3 className={`mb-4 text-lg font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>{title}</h3>
      <ul className="space-y-3">
        {points.map((p, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-white/70">
            <span className={positive ? "text-green-400" : "text-red-400"}>
              {positive ? "✓" : "✗"}
            </span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-xl font-bold">PipTrak</span>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/login")} className="text-sm text-white/50 hover:text-white transition">Sign In</button>
            <button onClick={() => router.push("/register")} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-6 inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300">
            Built for prop firm traders
          </p>
          <h1 className="text-5xl font-bold leading-tight md:text-6xl">
            Don't blow your challenge.
            <br />
            <span className="text-blue-400">Know what's worth trading.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/50">
            Most journals tell you what you did wrong yesterday. PipTrak stops you from blowing your account today —
            and gives you institutional-grade market intelligence before you open a single chart.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => router.push("/register")} className="rounded-2xl bg-blue-600 px-8 py-4 font-semibold hover:bg-blue-700 transition">
              Start Free →
            </button>
            <button onClick={() => router.push("/login")} className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-semibold hover:bg-white/10 transition">
              Sign In
            </button>
          </div>
          <p className="mt-4 text-sm text-white/30">No credit card required · Free forever plan</p>

          <div className="mt-20 grid gap-8 sm:grid-cols-3">
            <Stat number="3%" label="Auto-close at your daily loss limit" />
            <Stat number="24/7" label="Real market intelligence, every morning" />
            <Stat number="AI" label="Every trade reviewed and scored" />
          </div>
        </div>
      </section>

      {/* The killer feature */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-10">
            <p className="mb-3 inline-block rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300">
              Risk Guardian
            </p>
            <h2 className="text-3xl font-bold mb-4">One bad day shouldn't cost you a funded account.</h2>
            <p className="text-white/50 mb-6 leading-relaxed">
              PipTrak's Expert Advisor sits inside your MT4/MT5 terminal and hard-closes every open position
              the moment you hit your daily loss limit. Not a notification. Not a warning. It actually closes them.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniCard title="Automatic" text="Runs in your terminal, no manual input" />
              <MiniCard title="Configurable" text="Set your own daily loss %" />
              <MiniCard title="No profit cap" text="Let winners run, only losses are capped" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-4xl font-bold mb-4">Everything a serious trader needs</h2>
          <p className="text-center text-white/40 mb-16">One platform. No spreadsheets.</p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon="🌅"
              title="Morning Brief"
              text="Real forex prices, COT institutional positioning, correlations, volatility by pair. Every claim cites its actual news source."
            />
            <Feature
              icon="🤖"
              title="AI Trade Review"
              text="Every trade scored on execution, risk, and psychology. Upload your chart screenshot and AI analyses the entry."
            />
            <Feature
              icon="📋"
              title="Your Rules, Enforced"
              text="Set your own trading rules. AI checks every trade against them and tells you exactly when you broke one."
            />
            <Feature
              icon="🔌"
              title="MT4/MT5 Auto-Sync"
              text="Trades appear in your journal automatically as you close them. No manual entry, ever."
            />
            <Feature
              icon="🏦"
              title="Prop Firm Tracker"
              text="Track drawdown, profit target, and days remaining per account. Know exactly where you stand."
            />
            <Feature
              icon="⚡"
              title="Alpha (Solana)"
              text="Real Solana token research with RugCheck risk flags. Know what to avoid before you ape in."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-4xl font-bold mb-16">How it works</h2>
          <div className="space-y-8">
            <Step num="1" title="Connect your account" text="Download the PipTrak connector, drop it on a chart. Takes 3 minutes. Or import a CSV from any platform." />
            <Step num="2" title="Trade normally" text="Your trades sync automatically. Risk Guardian watches your daily loss limit in the background." />
            <Step num="3" title="Get coached" text="AI reviews every trade, checks your rules, and shows you the patterns costing you money." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-4xl font-bold mb-4">Simple pricing</h2>
          <p className="text-center text-white/40 mb-16">Start free. Upgrade when it pays for itself.</p>

          <div className="grid gap-6 lg:grid-cols-3">
            <PriceCard
              name="Free"
              price="€0"
              desc="Test the habit"
              features={["Manual trade journal", "10 AI reviews / month", "Daily journal", "Trading rules", "Basic analytics"]}
              cta="Start Free"
              onClick={() => router.push("/register")}
            />
            <PriceCard
              name="Pro"
              price="€19.99"
              desc="For serious traders"
              features={["Unlimited AI reviews", "Screenshot analysis", "Morning Brief", "Market Analysis", "Crypto Intelligence", "CSV import", "Prop firm tracker"]}
              cta="Go Pro"
              highlight
              onClick={() => router.push("/register")}
            />
            <PriceCard
              name="Elite"
              price="€39.99"
              desc="Full protection + automation"
              features={["Everything in Pro", "🛡 Risk Guardian auto-close", "MT4/MT5 auto-sync", "Auto trade execution", "PipTrak Alpha (Solana)", "Multi-account", "Priority support"]}
              cta="Go Elite"
              onClick={() => router.push("/register")}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold mb-4">Protect your account. Trade smarter.</h2>
          <p className="text-white/50 mb-8">Free forever plan. No credit card. Install as an app on your phone.</p>
          <button onClick={() => router.push("/register")} className="rounded-2xl bg-blue-600 px-10 py-4 font-semibold hover:bg-blue-700 transition">
            Create Free Account →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="font-bold">PipTrak</span>
            <div className="flex flex-wrap gap-4 text-sm text-white/30">
              <a href="/support" className="hover:text-white transition">Support</a>
              <a href="/privacy" className="hover:text-white transition">Privacy</a>
              <a href="/terms" className="hover:text-white transition">Terms</a>
              <a href="/risk-disclaimer" className="hover:text-white transition">Risk Disclaimer</a>
            </div>
          </div>
          <p className="mt-6 text-xs text-white/20 leading-relaxed">
            ⚠️ Trading forex, CFDs, and cryptocurrencies carries substantial risk and is not suitable for everyone.
            PipTrak provides research and journaling tools only. Nothing on this platform is financial advice.
            AI-generated analysis may be incorrect. Past performance does not indicate future results.
            Never risk more than you can afford to lose.
          </p>
        </div>
      </footer>
    </main>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <p className="text-4xl font-bold text-blue-400">{number}</p>
      <p className="mt-2 text-sm text-white/40">{label}</p>
    </div>
  );
}

function MiniCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm font-semibold mb-1">{title}</p>
      <p className="text-xs text-white/40">{text}</p>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <p className="text-3xl mb-3">{icon}</p>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{text}</p>
    </div>
  );
}

function Step({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div className="flex gap-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold">{num}</span>
      <div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-white/40">{text}</p>
      </div>
    </div>
  );
}

function PriceCard({ name, price, desc, features, cta, highlight, onClick }: {
  name: string; price: string; desc: string; features: string[]; cta: string; highlight?: boolean; onClick: () => void;
}) {
  return (
    <div className={`rounded-3xl border p-8 ${highlight ? "border-blue-500/50 bg-blue-500/5" : "border-white/10 bg-white/[0.04]"}`}>
      {highlight && (
        <p className="mb-3 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400">Most popular</p>
      )}
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="text-sm text-white/40 mb-4">{desc}</p>
      <p className="text-4xl font-bold mb-6">{price}<span className="text-base font-normal text-white/30">/mo</span></p>
      <div className="space-y-2 mb-8">
        {features.map((f, i) => (
          <p key={i} className="text-sm text-white/60">✓ {f}</p>
        ))}
      </div>
      <button onClick={onClick} className={`w-full rounded-2xl py-3 font-semibold transition ${highlight ? "bg-blue-600 hover:bg-blue-700" : "border border-white/10 bg-white/5 hover:bg-white/10"}`}>
        {cta}
      </button>
    </div>
  );
}
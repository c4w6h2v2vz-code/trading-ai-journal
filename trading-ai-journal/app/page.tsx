export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="text-xl font-bold">Trading AI Journal</div>
        <button className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 hover:bg-white/10">
          Login
        </button>
      </nav>

      <section className="mx-auto grid min-h-[80vh] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            AI-powered trading performance system
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-7xl">
            Trade better with an AI journal built for serious traders.
          </h1>

          <p className="mb-8 max-w-xl text-lg text-white/60">
            Track your trades, analyze your mistakes, review your psychology,
            and let AI help you become more consistent.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="rounded-xl bg-blue-600 px-6 py-3 font-medium hover:bg-blue-700">
              Start Free
            </button>
            <button className="rounded-xl border border-white/20 px-6 py-3 font-medium text-white/80 hover:bg-white/10">
              See Features
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Performance Dashboard</h2>
            <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
              Live
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Stat title="Total P&L" value="+$4,820" />
            <Stat title="Win Rate" value="63.8%" />
            <Stat title="Profit Factor" value="2.14" />
            <Stat title="AI Score" value="91/100" />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
            <p className="mb-2 text-sm text-white/40">AI Coach Insight</p>
            <p className="text-white/80">
              Your best trades come during London session. Avoid entries after
              two losses in one day.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
      <p className="text-sm text-white/40">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
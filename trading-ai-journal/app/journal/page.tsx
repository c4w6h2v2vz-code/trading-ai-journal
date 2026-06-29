export default function JournalPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold mb-2">Trading Journal</h1>
        <p className="text-white/50 mb-8">
          Add your trades and review your performance.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-semibold mb-6">Add New Trade</h2>

          <form className="grid gap-4 md:grid-cols-2">
            <input className="rounded-xl bg-black border border-white/10 p-3" placeholder="Pair e.g. EUR/USD" />
            <input className="rounded-xl bg-black border border-white/10 p-3" placeholder="Session e.g. London" />
            <input className="rounded-xl bg-black border border-white/10 p-3" placeholder="Entry price" />
            <input className="rounded-xl bg-black border border-white/10 p-3" placeholder="Exit price" />
            <input className="rounded-xl bg-black border border-white/10 p-3" placeholder="Profit / Loss" />
            <select className="rounded-xl bg-black border border-white/10 p-3">
              <option>Win</option>
              <option>Loss</option>
              <option>Break Even</option>
            </select>

            <textarea
              className="md:col-span-2 rounded-xl bg-black border border-white/10 p-3"
              placeholder="Trade notes, mistake, psychology..."
              rows={5}
            />

            <button className="md:col-span-2 rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-700">
              Save Trade
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
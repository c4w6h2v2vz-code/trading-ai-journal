"use client";

type Trade = {
  id: string;
  user_id: string;
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
  created_at: string;
};

export default function TradeForm({
  editingTrade,
  saving,
  onSubmit,
  onCancelEdit,
  onImageChange,
}: {
  editingTrade: Trade | null;
  saving: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onImageChange: (file: File | null) => void;
}) {
  return (
    <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
      <h2 className="mb-2 text-2xl font-semibold">
        {editingTrade ? "Edit Trade" : "Add New Trade"}
      </h2>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <Input name="pair" placeholder="Pair e.g. EURUSD" defaultValue={editingTrade?.pair || ""} />
        <Select name="direction" defaultValue={editingTrade?.direction || "Buy"} options={["Buy", "Sell"]} />
        <Input name="strategy" placeholder="Strategy e.g. SMC, Breakout" defaultValue={editingTrade?.strategy || ""} />
        <Input name="session" placeholder="Session e.g. London" defaultValue={editingTrade?.session || ""} />
        <Input name="entry_price" placeholder="Entry price" defaultValue={editingTrade?.entry_price || ""} />
        <Input name="exit_price" placeholder="Exit price" defaultValue={editingTrade?.exit_price || ""} />
        <Input name="profit_loss" placeholder="Profit / Loss" defaultValue={editingTrade?.profit_loss || ""} />
        <Input name="risk_reward" placeholder="Risk Reward e.g. 2.5" defaultValue={editingTrade?.risk_reward || ""} />

        <Select name="result" defaultValue={editingTrade?.result || "Win"} options={["Win", "Loss", "Break Even"]} />
        <Select name="grade" defaultValue={editingTrade?.grade || "A"} options={["A+", "A", "B", "C", "D"]} />
        <Select name="emotion" defaultValue={editingTrade?.emotion || "Calm"} options={["Calm", "Confident", "Fear", "Greed", "FOMO", "Revenge"]} />
        <Input name="mistake" placeholder="Mistake e.g. Early entry" defaultValue={editingTrade?.mistake || ""} />

        <textarea
          name="notes"
          defaultValue={editingTrade?.notes || ""}
          className="md:col-span-2 rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
          placeholder="Trade notes, mistakes, psychology..."
          rows={5}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => onImageChange(e.target.files?.[0] || null)}
          className="md:col-span-2 rounded-2xl border border-white/10 bg-black/50 p-4 text-white"
        />

        <button
          type="submit"
          disabled={saving}
          className="md:col-span-2 rounded-2xl bg-blue-600 py-4 font-semibold transition hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : editingTrade ? "Update Trade" : "Save Trade"}
        </button>

        {editingTrade && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="md:col-span-2 rounded-2xl bg-white/10 py-4 font-semibold transition hover:bg-white/20"
          >
            Cancel Edit
          </button>
        )}
      </form>
    </div>
  );
}

function Input({
  name,
  placeholder,
  defaultValue,
}: {
  name: string;
  placeholder: string;
  defaultValue: string | number;
}) {
  return (
    <input
      name={name}
      defaultValue={defaultValue}
      className="rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
      placeholder={placeholder}
    />
  );
}

function Select({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}
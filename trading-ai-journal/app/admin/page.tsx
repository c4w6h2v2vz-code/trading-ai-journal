"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "jamashire04@gmail.com";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    proUsers: 0,
    eliteUsers: 0,
    freeUsers: 0,
    totalTrades: 0,
    totalMt5Trades: 0,
  });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/dashboard");
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const { count: tradeCount } = await supabase
        .from("trades")
        .select("*", { count: "exact", head: true });

      const { count: mt5Count } = await supabase
        .from("mt5_trades")
        .select("*", { count: "exact", head: true });

      const profileList = profiles || [];
      setUsers(profileList);
      setStats({
        totalUsers: profileList.length,
        proUsers: profileList.filter(p => p.plan === "pro").length,
        eliteUsers: profileList.filter(p => p.plan === "elite").length,
        freeUsers: profileList.filter(p => p.plan === "free" || !p.plan).length,
        totalTrades: tradeCount || 0,
        totalMt5Trades: mt5Count || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
      <p className="text-white/40">Loading admin...</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">PipTrak Admin</h1>
            <p className="text-white/40 mt-1">Overview of your SaaS metrics</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
          >
            ← Back to App
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <StatCard label="Total Users" value={String(stats.totalUsers)} color="text-blue-400" />
          <StatCard label="Pro Users" value={String(stats.proUsers)} color="text-green-400" />
          <StatCard label="Elite Users" value={String(stats.eliteUsers)} color="text-purple-400" />
          <StatCard label="Free Users" value={String(stats.freeUsers)} color="text-white" />
          <StatCard label="Manual Trades" value={String(stats.totalTrades)} color="text-yellow-400" />
          <StatCard label="MT5 Trades" value={String(stats.totalMt5Trades)} color="text-orange-400" />
        </div>

        {/* Revenue estimate */}
        <div className="mb-8 rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
          <h2 className="mb-4 text-xl font-semibold">Revenue Estimate</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-white/40">Monthly Revenue</p>
              <p className="text-3xl font-bold text-green-400">
                €{(stats.proUsers * 19 + stats.eliteUsers * 49).toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">From Pro</p>
              <p className="text-2xl font-bold text-blue-400">€{(stats.proUsers * 19).toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">From Elite</p>
              <p className="text-2xl font-bold text-purple-400">€{(stats.eliteUsers * 49).toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-xl font-semibold">All Users ({stats.totalUsers})</h2>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4">
                <div>
                  <p className="font-semibold">{user.email || "No email"}</p>
                  <p className="text-sm text-white/40">
                    {user.trading_style || "No style"} · {user.main_market || "No market"}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    user.plan === "pro" ? "bg-blue-500/20 text-blue-400" :
                    user.plan === "elite" ? "bg-purple-500/20 text-purple-400" :
                    "bg-white/10 text-white/40"
                  }`}>
                    {user.plan || "free"}
                  </span>
                  <p className="text-xs text-white/30 mt-1">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm text-white/40">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color || "text-white"}`}>{value}</p>
    </div>
  );
}
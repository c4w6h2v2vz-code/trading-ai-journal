"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setEmail(user.email || "");
    }
    getUser();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-10">
          <p className="mb-3 w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-white/40">
            Settings
          </p>
          <h1 className="text-4xl font-bold">Account Settings</h1>
          <p className="mt-3 text-white/50">Manage your account and preferences.</p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-300">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-lg font-semibold">Account</h2>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-white/40">Email</p>
              <p className="mt-1 font-semibold">{email}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-lg font-semibold">Plan</h2>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-sm text-blue-400 font-semibold">Free Plan</p>
              <p className="mt-1 text-sm text-white/40">Upgrade to Pro for unlimited AI reviews and advanced features.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-red-500/10 bg-red-500/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-red-400">Danger Zone</h2>
            <button
              onClick={logout}
              className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
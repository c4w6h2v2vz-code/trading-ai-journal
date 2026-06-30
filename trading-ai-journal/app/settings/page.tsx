"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email || "");
    }

    loadUser();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-10">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            Account Settings
          </p>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Settings
          </h1>

          <p className="mt-3 text-white/50">
            Manage your account and trading journal preferences.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
          <h2 className="text-2xl font-semibold">Profile</h2>
          <p className="mt-2 text-sm text-white/40">Your logged-in account.</p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
            <p className="text-sm text-white/40">Email</p>
            <p className="mt-2 text-lg font-semibold">{email || "Loading..."}</p>
          </div>

          <button
            onClick={logout}
            className="mt-6 rounded-2xl bg-red-500/10 px-5 py-3 font-semibold text-red-400 hover:bg-red-500/20"
          >
            Logout
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
          <h2 className="text-2xl font-semibold">Preferences</h2>
          <p className="mt-2 text-sm text-white/40">
            More options will be added here later.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <p className="text-sm text-white/40">Theme</p>
              <p className="mt-2 font-semibold">Dark Mode</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <p className="text-sm text-white/40">Currency</p>
              <p className="mt-2 font-semibold">USD</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
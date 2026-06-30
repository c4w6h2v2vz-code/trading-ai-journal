"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
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

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
          Trader Profile
        </p>

        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Profile
        </h1>

        <p className="mt-3 text-white/50">
          Your trading identity and account overview.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-2xl font-semibold">Account</h2>

            <div className="mt-6 space-y-4">
              <Info label="Email" value={email || "Loading..."} />
              <Info label="Plan" value="Free Plan" />
              <Info label="Account Type" value="Private Trader" />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-2xl font-semibold">Trading Profile</h2>

            <div className="mt-6 space-y-4">
              <Info label="Trading Style" value="Day Trading" />
              <Info label="Main Market" value="Forex" />
              <Info label="Experience Level" value="Beginner / Growing Trader" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="text-sm text-white/40">{label}</p>
      <p className="mt-2 font-semibold text-white">{value}</p>
    </div>
  );
}
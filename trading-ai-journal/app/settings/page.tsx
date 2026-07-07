"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState("free");
const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();
      setPlan(profile?.plan || "free");
    }
    getUser();
  }, []);
async function enableNotifications() {
    setNotifLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        alert('Please allow notifications to receive alerts.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, userId: user.id }),
      });

      setNotifEnabled(true);
      setMessage('Notifications enabled ✅');
    } catch (err) {
      setMessage('Error: ' + String(err));
    } finally {
      setNotifLoading(false);
    }
  }
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
            <div className={`rounded-2xl border p-4 ${
              plan === "pro" ? "border-blue-500/20 bg-blue-500/10" :
              plan === "elite" ? "border-purple-500/20 bg-purple-500/10" :
              "border-white/10 bg-white/5"
            }`}>
              <p className={`text-sm font-semibold ${
                plan === "pro" ? "text-blue-400" :
                plan === "elite" ? "text-purple-400" :
                "text-white/60"
              }`}>
                {plan === "pro" ? "Pro Plan ✅" : plan === "elite" ? "Elite Plan ✅" : "Free Plan"}
              </p>
              <p className="mt-1 text-sm text-white/40">
                {plan === "pro" ? "You have full access to all Pro features." :
                 plan === "elite" ? "You have full access to all Elite features." :
                 "Upgrade to Pro for unlimited AI reviews and advanced features."}
              </p>
              {plan === "free" && (
                <a href="/pricing" className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700">
                  Upgrade Now
                </a>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-red-500/10 bg-red-500/5 p-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-lg font-semibold">Notifications</h2>
            <p className="text-sm text-white/40 mb-4">
              Get instant alerts when your daily loss limit is hit or profit target reached.
            </p>
            <button
              onClick={enableNotifications}
              disabled={notifLoading || notifEnabled}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold transition hover:bg-blue-700 disabled:opacity-50"
            >
              {notifLoading ? "Enabling..." : notifEnabled ? "Notifications Enabled ✅" : "Enable Push Notifications"}
            </button>
          </div>
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
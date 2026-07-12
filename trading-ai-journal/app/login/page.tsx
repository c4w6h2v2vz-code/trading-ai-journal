"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setMessage("Please enter email and password.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login")) {
        setMessage("Wrong email or password. Please try again.");
      } else if (error.message.includes("Email not confirmed")) {
        setMessage("Please check your email and confirm your account first.");
      } else {
        setMessage(error.message);
      }
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">PipTrak</h1>
          <p className="text-white/40 mt-1">AI-Powered Trading Intelligence</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/50">
          <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-white/40 text-sm mb-6">
            Log in to your trading dashboard.
          </p>

          {message && (
            <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
              message.includes("check your email")
                ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 outline-none focus:border-blue-500 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Password</label>
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 outline-none focus:border-blue-500 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 py-4 font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Logging in..." : "Log In →"}
            </button>
          </form>

          {/* Social proof */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/20">
            <span>🔒 Secure</span>
            <span>·</span>
            <span>AI Trading Coach</span>
            <span>·</span>
            <span>piptrak.com</span>
          </div>
        </div>

        {/* Register link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/register")}
            className="text-white/40 hover:text-white text-sm transition"
          >
            Don't have an account? <span className="text-blue-400">Create one free →</span>
          </button>
        </div>
      </div>
    </main>
  );
}
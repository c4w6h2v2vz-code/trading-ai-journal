"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  }
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

    // Check if user needs onboarding
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile?.onboarded) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard");
    }
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

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/30">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 font-semibold hover:bg-white/10 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

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
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!name || !email || !password) {
      setMessage("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (!agreed) {
      setMessage("Please agree to the Terms of Service.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Account created ✅ Check your email to verify, then log in.");
    setLoading(false);

    setTimeout(async () => {
      const { data } = await supabase.auth.signInWithPassword({ email, password });
      if (data.user) {
        router.push("/onboarding");
      } else {
        router.push("/login");
      }
    }, 2000);
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
          <h2 className="text-2xl font-bold mb-1">Create your account</h2>
          <p className="text-white/40 text-sm mb-6">
            Start your trading journey with AI coaching.
          </p>

          {message && (
            <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
              message.includes("✅")
                ? "border-green-500/20 bg-green-500/10 text-green-300"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={register} className="space-y-4">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Full Name</label>
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 outline-none focus:border-blue-500 text-white"
              />
            </div>

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
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 outline-none focus:border-blue-500 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                required
                minLength={8}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 outline-none focus:border-blue-500 text-white"
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setAgreed(!agreed)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                  agreed ? "bg-blue-600 border-blue-600" : "border-white/20 bg-white/5"
                }`}
              >
                {agreed && <span className="text-xs text-white">✓</span>}
              </button>
              <p className="text-xs text-white/40">
                I agree to the{" "}
                <span className="text-blue-400 cursor-pointer hover:underline">Terms of Service</span>
                {" "}and{" "}
                <span className="text-blue-400 cursor-pointer hover:underline">Privacy Policy</span>.
                I understand PipTrak provides research tools, not financial advice.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full rounded-2xl bg-blue-600 py-4 font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Creating account..." : "Create Free Account →"}
            </button>
          </form>

          {/* Social proof */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/20">
            <span>🔒 Secure</span>
            <span>·</span>
            <span>Free forever plan</span>
            <span>·</span>
            <span>No credit card</span>
          </div>
        </div>

        {/* Login link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/login")}
            className="text-white/40 hover:text-white text-sm transition"
          >
            Already have an account? <span className="text-blue-400">Log in →</span>
          </button>
        </div>
      </div>
    </main>
  );
}
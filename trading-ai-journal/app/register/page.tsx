"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(event: React.FormEvent<HTMLFormElement>) {
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Account created ✅ Please login.");
    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 1000);
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/50">
        <p className="mb-4 w-fit rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1 text-sm text-green-300">
          Create your account
        </p>

        <h1 className="text-4xl font-bold mb-2">Start Trading Smarter</h1>
        <p className="text-white/50 mb-8">
          Create your Trading AI Journal account.
        </p>

        {message && (
          <div className="mb-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-3 text-green-300">
            {message}
          </div>
        )}

        <form onSubmit={register} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 outline-none focus:border-blue-500"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 py-4 font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <button
          onClick={() => router.push("/login")}
          className="mt-6 w-full text-white/50 hover:text-white"
        >
          Already have an account? Login
        </button>
      </div>
    </main>
  );
}
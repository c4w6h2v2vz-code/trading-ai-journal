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
      setMessage("Please enter your email and password.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/journal");
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8">
        <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
        <p className="text-white/50 mb-8">
          Sign in to your Trading AI Journal
        </p>

        {message && <p className="mb-4 text-red-400">{message}</p>}

        <form onSubmit={login} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-xl bg-black border border-white/10 p-3"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full rounded-xl bg-black border border-white/10 p-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <button
          onClick={() => router.push("/register")}
          className="mt-6 w-full text-white/60 hover:text-white"
        >
          Don't have an account? Register
        </button>
      </div>
    </main>
  );
}
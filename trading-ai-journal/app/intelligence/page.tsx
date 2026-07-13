"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IntelligenceRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/morning-brief");
  }, [router]);

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center">
      <p className="text-white/40">Redirecting to Morning Brief...</p>
    </main>
  );
}
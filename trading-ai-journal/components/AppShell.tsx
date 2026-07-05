"use client";

import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const links = [{ name: "Risk Manager", href: "/risk-manager" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Journal", href: "/journal" },
  { name: "Calendar", href: "/calendar" },
  { name: "Psychology", href: "/psychology" },
  { name: "Goals", href: "/goals" },

  { name: "Analytics", href: "/analytics" },
  { name: "Profile", href: "/profile" },
  { name: "Settings", href: "/settings" },
];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-white/10 bg-black/40 p-6 lg:block">
          <h1 className="text-2xl font-bold">Trading AI</h1>
          <p className="mt-1 text-sm text-white/40">Professional journal</p>

          <nav className="mt-10 space-y-2">
            {links.map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`w-full rounded-2xl px-4 py-3 text-left font-medium transition ${
                  pathname === link.href
                    ? "bg-blue-600 text-white"
                    : "text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.name}
              </button>
            ))}
          </nav>

          <button
            onClick={logout}
            className="mt-10 w-full rounded-2xl bg-red-500/10 px-4 py-3 font-semibold text-red-400 hover:bg-red-500/20"
          >
            Logout
          </button>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 px-4 py-4 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between">
              <h1 className="font-bold">Trading AI</h1>

              <div className="flex gap-2">
                {links.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => router.push(link.href)}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      pathname === link.href
                        ? "bg-blue-600"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {link.name}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {children}
        </div>
      </div>
    </main>
  );
}
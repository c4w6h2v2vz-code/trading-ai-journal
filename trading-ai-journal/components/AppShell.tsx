"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Journal", href: "/journal", icon: "📓" },
  { name: "Analytics", href: "/analytics", icon: "📈" },
  { name: "AI Coach", href: "/psychology", icon: "🤖" },
  { name: "More", href: "/settings", icon: "☰" },
];

const allLinks = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Journal", href: "/journal" },
  { name: "Risk Manager", href: "/risk-manager" },
  { name: "Calendar", href: "/calendar" },
  { name: "Psychology", href: "/psychology" },
  { name: "Analytics", href: "/analytics" },
  { name: "Goals", href: "/goals" },
  { name: "Profile", href: "/profile" },
  { name: "Reports", href: "/reports" },
  { name: "Settings", href: "/settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <nav className="hidden md:flex sticky top-0 z-50 items-center gap-2 border-b border-white/10 bg-black/80 px-6 py-3 backdrop-blur-xl">
        <span className="mr-4 text-lg font-bold tracking-tight">Trading AI</span>
        {allLinks.map((link) => (
          <a key={link.href} href={link.href} className={`rounded-xl px-3 py-2 text-sm transition ${pathname === link.href ? "bg-blue-600 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"}`}>
            {link.name}
          </a>
        ))}
        <button onClick={logout} className="ml-auto rounded-xl bg-white/5 px-4 py-2 text-sm text-white/50 hover:bg-white/10">Logout</button>
      </nav>
      <div className="md:hidden sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-xl">
        <span className="text-base font-bold tracking-tight">Trading AI</span>
        <button onClick={logout} className="rounded-xl bg-white/5 px-3 py-2 text-xs text-white/50">Logout</button>
      </div>
      <div className="pb-24 md:pb-0">{children}</div>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="flex items-center justify-around px-2 py-2">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.name === "More" && !links.slice(0, 4).some((l) => l.href === pathname));
            if (link.name === "More") {
              return (
                <button key={link.name} onClick={() => setShowMenu(!showMenu)} className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs transition ${isActive ? "text-blue-400" : "text-white/40"}`}>
                  <span className="text-xl">{link.icon}</span>
                  <span>{link.name}</span>
                </button>
              );
            }
            return (
              <a key={link.href} href={link.href} className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs transition ${pathname === link.href ? "text-blue-400" : "text-white/40"}`}>
                <span className="text-xl">{link.icon}</span>
                <span>{link.name}</span>
              </a>
            );
          })}
        </div>
      </nav>
      {showMenu && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowMenu(false)}>
          <div className="absolute bottom-20 left-4 right-4 rounded-3xl border border-white/10 bg-[#111] p-4" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">All Pages</p>
            <div className="grid grid-cols-2 gap-2">
              {allLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setShowMenu(false)} className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${pathname === link.href ? "border-blue-500/50 bg-blue-500/10 text-blue-400" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}>
                  {link.name}
                </a>
              ))}
            </div>
            <button onClick={logout} className="mt-3 w-full rounded-2xl border border-red-500/20 bg-red-500/10 py-3 text-sm text-red-400">Logout</button>
          </div>
        </div>
      )}
    </main>
  );
}
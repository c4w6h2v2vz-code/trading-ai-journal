"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const navGroups = [
  {
    label: "Trading",
    links: [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Trade Journal", href: "/journal" },
      { name: "Daily Journal", href: "/daily-journal" },
      { name: "Calendar", href: "/calendar" },
    ],
  },
  {
    label: "Intelligence",
    links: [
      { name: "Morning Brief", href: "/morning-brief" },
      { name: "Market Analysis", href: "/market-analysis" },
      { name: "Crypto Intel", href: "/crypto-intelligence" },
      { name: "Alpha", href: "/alpha" },
      
    ],
  },
  {
    label: "Tools",
    links: [
      { name: "Trading Rules", href: "/trading-rules" },
      { name: "Risk Manager", href: "/risk-manager" },
      { name: "Prop Firm", href: "/prop-firm" },
      { name: "Psychology", href: "/psychology" },
      { name: "Analytics", href: "/analytics" },
      { name: "Goals", href: "/goals" },
    ],
  },
  {
    label: "Account",
    links: [
    
      { name: "Accounts", href: "/accounts" },
      { name: "Import", href: "/import" },
      { name: "Reports", href: "/reports" },
      { name: "Profile", href: "/profile" },
      { name: "Settings", href: "/settings" },
      { name: "Support", href: "/support" },
    ],
  },
];

const mobileLinks = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Journal", href: "/journal", icon: "📓" },
  { name: "Brief", href: "/morning-brief", icon: "🌅" },
  { name: "Analytics", href: "/analytics", icon: "📈" },
  { name: "More", href: "", icon: "☰" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);

  function handleLogout() {
    import("@/lib/supabase").then(({ supabase }) => {
      supabase.auth.signOut().then(() => router.push("/login"));
    });
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-56 flex-col border-r border-white/5 bg-black/80 backdrop-blur-xl lg:flex overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
          <span className="text-lg font-bold tracking-tight">PipTrak</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-white/20">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.links.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => router.push(link.href)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                      pathname === link.href
                        ? "bg-blue-600 font-semibold text-white"
                        : "text-white/50 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {link.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/5 px-3 py-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/5 bg-black/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <span className="text-base font-bold tracking-tight">PipTrak</span>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="rounded-xl bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition"
        >
          {showMenu ? "✕" : "☰"}
        </button>
      </header>

      {/* Mobile Dropdown Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-40 bg-black/95 pt-14 px-4 overflow-y-auto lg:hidden">
          <nav className="space-y-4 pb-24">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/20">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.links.map((link) => (
                    <button
                      key={link.href}
                      onClick={() => {
                        router.push(link.href);
                        setShowMenu(false);
                      }}
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                        pathname === link.href
                          ? "bg-blue-600 font-semibold"
                          : "text-white/60 hover:bg-white/5"
                      }`}
                    >
                      {link.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={handleLogout}
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition"
            >
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/5 bg-black/90 px-2 py-2 backdrop-blur-xl lg:hidden">
        {mobileLinks.map((link) => (
          <button
            key={link.name}
            onClick={() => {
              if (link.name === "More") {
                setShowMobileMore(!showMobileMore);
              } else {
                router.push(link.href);
                setShowMobileMore(false);
              }
            }}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition ${
              pathname === link.href
                ? "text-blue-400"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <span className="text-lg">{link.icon}</span>
            <span className="text-xs">{link.name}</span>
          </button>
        ))}
      </nav>

      {/* Mobile More Menu */}
      {showMobileMore && (
        <div className="fixed bottom-16 left-0 right-0 z-40 mx-2 mb-2 rounded-3xl border border-white/10 bg-black/95 p-4 backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-3 gap-2">
            {navGroups.flatMap(g => g.links)
              .filter(l => !mobileLinks.find(m => m.href === l.href))
              .map((link) => (
                <button
                  key={link.href}
                  onClick={() => {
                    router.push(link.href);
                    setShowMobileMore(false);
                  }}
                  className={`rounded-2xl p-3 text-center text-xs transition ${
                    pathname === link.href
                      ? "bg-blue-600 font-semibold"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {link.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-14 pb-20 lg:pt-0 lg:pb-0 lg:pl-56">
        {children}
      </main>
    </div>
  );
}
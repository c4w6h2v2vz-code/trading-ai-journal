"use client";

import React from "react";

// ============ DESIGN TOKENS ============
// One accent (blue). Green/red ONLY for P/L. Near-black surfaces. High-contrast data.

// ============ CARD ============
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

// ============ STAT CARD ============
export function Stat({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const valueColor =
    tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-red-400" : "text-white";
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-white/35">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/30">{sub}</p>}
    </div>
  );
}

// ============ BUTTON ============
export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const base = "rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm" };
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98]",
    ghost: "border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

// ============ BADGE ============
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "positive" | "negative" | "accent";
}) {
  const tones = {
    neutral: "bg-white/[0.06] text-white/50",
    positive: "bg-emerald-500/15 text-emerald-400",
    negative: "bg-red-500/15 text-red-400",
    accent: "bg-blue-500/15 text-blue-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

// ============ PAGE HEADER ============
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-medium uppercase tracking-wider text-blue-400">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-white/40">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ============ SECTION LABEL ============
export function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
      {children}
      {count !== undefined && <span className="text-xs font-normal text-white/30">({count})</span>}
    </h2>
  );
}

// ============ P/L VALUE (green/red, consistent) ============
export function PL({ value, prefix = "$" }: { value: number; prefix?: string }) {
  const color = value > 0 ? "text-emerald-400" : value < 0 ? "text-red-400" : "text-white/50";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`font-semibold tabular-nums ${color}`}>
      {sign}{prefix}{Math.abs(value).toFixed(2)}
    </span>
  );
}

// ============ EMPTY STATE ============
export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
      <p className="mb-2 text-3xl opacity-40">{icon}</p>
      <p className="text-sm text-white/40">{text}</p>
    </div>
  );
}
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SkeletonBlock({ className = "", light = false }: { className?: string; light?: boolean }) {
  return <div aria-hidden="true" className={cn("max-w-full animate-pulse rounded-lg motion-reduce:animate-none", light ? "bg-white/20" : "bg-slate-200/70", className)} />;
}

export function SkeletonPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5", className)}>{children}</section>;
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return <div className="divide-y divide-slate-100">{Array.from({ length: rows }, (_, index) => <div key={index} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0 flex-1"><SkeletonBlock className="h-4 w-40" /><SkeletonBlock className="mt-2 h-3 w-56" /></div><SkeletonBlock className="h-8 w-20 shrink-0" /></div>)}</div>;
}

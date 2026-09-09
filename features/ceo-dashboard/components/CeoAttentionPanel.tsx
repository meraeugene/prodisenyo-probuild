import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CeoAttentionItem } from "@/features/ceo-dashboard/types";

export default function CeoAttentionPanel({ items }: { items: CeoAttentionItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,.7)]">
      <div>
        <h2 className="font-bold text-slate-950">Watchlist</h2>
        <p className="mt-0.5 text-xs text-slate-500">Schedule and budget exceptions</p>
      </div>
      <div className="mt-4 divide-y divide-slate-100">
        {items.slice(0, 5).map((item) => (
          <Link key={item.id} href={item.href} className="flex items-center gap-3 py-3 first:pt-0 hover:text-teal-800">
            <span className={`h-2 w-2 shrink-0 rounded-full ${item.tone === "rose" ? "bg-rose-500" : "bg-amber-500"}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900">{item.label}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{item.detail}</p>
            </div>
            <ArrowRight size={13} className="shrink-0 text-slate-400" />
          </Link>
        ))}
        {!items.length ? (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-teal-700">No derived alerts</p>
            <p className="mt-1 text-xs text-slate-500">No overdue or over-budget project was found.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

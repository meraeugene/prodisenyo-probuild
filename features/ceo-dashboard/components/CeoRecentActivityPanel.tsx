import Link from "next/link";
import type { CeoActivityItem } from "@/features/ceo-dashboard/types";
import { formatCeoDate } from "@/features/ceo-dashboard/utils/ceoDashboard";
import { Activity, Boxes, FileText, LineChart, ReceiptText } from "lucide-react";

export default function CeoRecentActivityPanel({ items }: { items: CeoActivityItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,.7)]">
      <div>
        <div className="flex items-center gap-2"><Activity size={16} className="text-teal-700" /><h2 className="font-bold text-slate-950">Recent activity</h2></div>
        <p className="mt-1 text-xs text-slate-500">The latest changes across your workflows</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.slice(0, 8).map((item) => {
          return (
            <Link key={item.id} href={item.href} className="group rounded-xl border border-slate-100 p-3 transition hover:border-teal-200 hover:bg-teal-50/30">
              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-between"><span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-50 text-teal-700">{item.type === "progress" ? <LineChart size={14} /> : item.type === "material" ? <Boxes size={14} /> : item.type === "estimate" ? <ReceiptText size={14} /> : <FileText size={14} />}</span><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.type}</span></div>
                <p className="line-clamp-2 text-xs font-bold leading-5 text-slate-900 group-hover:text-teal-800">{item.title}</p>
                <p className="mt-1 truncate text-[11px] text-slate-500">{item.detail}</p>
                <p className="mt-1 text-[10px] text-slate-400">{item.actor} · {formatCeoDate(item.createdAt)}</p>
              </div>
            </Link>
          );
        })}
        {!items.length ? (
          <p className="md:col-span-2 xl:col-span-4 py-8 text-center text-sm text-slate-500">No workflow activity is available yet.</p>
        ) : null}
      </div>
    </section>
  );
}

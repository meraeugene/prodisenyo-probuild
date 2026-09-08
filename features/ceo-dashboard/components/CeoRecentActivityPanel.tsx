import Link from "next/link";
import type { CeoActivityItem } from "@/features/ceo-dashboard/types";
import { formatCeoDate } from "@/features/ceo-dashboard/utils/ceoDashboard";

export default function CeoRecentActivityPanel({ items }: { items: CeoActivityItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <h2 className="font-bold text-slate-950">Recent Workflow Activity</h2>
        <p className="mt-0.5 text-xs text-slate-500">Progress, material, estimate, and document records</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.slice(0, 8).map((item) => {
          return (
            <Link key={item.id} href={item.href} className="rounded-xl border border-slate-100 p-3 transition hover:border-teal-200 hover:bg-teal-50/30">
              <div className="min-w-0">
                <p className="line-clamp-2 text-xs font-bold leading-5 text-slate-900">{item.title}</p>
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

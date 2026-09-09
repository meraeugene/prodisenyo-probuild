import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CeoApprovalSummary } from "@/features/ceo-dashboard/types";

const TONE_STYLES = {
  emerald: "bg-teal-50 text-teal-700 ring-teal-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
};

export default function CeoDashboardApprovalQueue({
  items,
}: {
  items: CeoApprovalSummary[];
}) {
  const pendingCount = items.reduce((total, item) => total + item.count, 0);

  return (
    <section
      id="approval-queue"
      className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,.7)]"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
        <div>
          <h2 className="font-bold text-slate-950">Decision queue</h2>
          <p className="mt-1 text-xs text-slate-500">Items ready for your review</p>
        </div>
        <span
          className={
            pendingCount > 0
              ? "rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700"
              : "rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700"
          }
        >
          {pendingCount > 0 ? `${pendingCount} pending` : "All clear"}
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.href} className="flex items-center gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-950">{item.label}</p>
              <p className="truncate text-xs text-slate-500">{item.detail}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${TONE_STYLES[item.tone]}`}>
              {item.count}
            </span>
            <Link
              href={item.href}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-teal-700 px-3 text-xs font-bold text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              Review <ArrowRight size={12} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

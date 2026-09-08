import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CeoApprovalSummary } from "@/features/ceo-dashboard/types";

export default function CeoDashboardApprovalQueue({
  items,
}: {
  items: CeoApprovalSummary[];
}) {
  return (
    <section
      id="approval-queue"
      className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-bold text-slate-950">Approval Queue</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.href} className="flex items-center gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-950">{item.label}</p>
              <p className="truncate text-xs text-slate-500">{item.detail}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
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

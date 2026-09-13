import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CeoApprovalSummary } from "@/features/ceo-dashboard/types";

export default function CeoDashboardApprovalQueue({ items }: { items: CeoApprovalSummary[] }) {
  const pendingItems = items.filter((item) => item.count > 0);

  return (
    <section id="approval-queue" className="scroll-mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-bold tracking-tight text-slate-950">Approval Queue</h2>
        <Link href="/payroll-approvals" className="text-xs font-semibold text-blue-700 hover:text-blue-900">View all</Link>
      </div>
      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1.6fr)_70px_64px] gap-3 border-b border-slate-100 bg-slate-50/40 px-5 py-2 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
        <span>Type</span><span>Description</span><span>Pending</span><span>Action</span>
      </div>
      <div className="divide-y divide-slate-100">
        {(pendingItems.length ? pendingItems : items).map((item) => (
          <div key={item.href} className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1.6fr)_70px_64px] items-center gap-3 px-5 py-3 text-xs">
            <p className="truncate font-semibold text-slate-800">{item.label}</p>
            <p className="truncate text-slate-500">{item.detail}</p>
            <p className="font-semibold text-slate-700 tabular-nums">{item.count}</p>
            <Link href={item.href} className="font-semibold text-emerald-700 hover:text-emerald-900">Review</Link>
          </div>
        ))}
      </div>
      <Link href="/payroll-approvals" className="flex items-center justify-end gap-1.5 border-t border-slate-100 px-5 py-3 text-xs font-semibold text-blue-700 hover:bg-blue-50/40">
        View all approvals <ArrowRight size={13} />
      </Link>
    </section>
  );
}

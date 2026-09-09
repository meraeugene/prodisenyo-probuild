import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatCeoCurrency } from "@/features/ceo-dashboard/utils/ceoDashboard";

export default function CeoBudgetSnapshot({
  totalBudget,
  estimatedCost,
  totalSpent,
}: {
  totalBudget: number;
  estimatedCost: number;
  totalSpent: number;
}) {
  const remaining = totalBudget - totalSpent;
  const percentage = totalBudget
    ? Math.min(100, Math.max(0, Math.round((totalSpent / totalBudget) * 100)))
    : 0;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,.7)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-950">Budget health</h2>
          <p className="mt-0.5 text-xs text-slate-500">Combined project spend</p>
        </div>
        <Link href="/budget-tracker" className="inline-flex items-center gap-1 text-xs font-bold text-teal-800">
          Details <ArrowRight size={13} />
        </Link>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[
          ["Budget ceiling", totalBudget],
          ["Estimated costs", estimatedCost],
          ["Actual spent", totalSpent],
          ["Remaining", remaining],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <div>
              <p className="text-[11px] text-slate-500">{label}</p>
              <p className="mt-0.5 text-sm font-bold text-slate-950">{formatCeoCurrency(Number(value))}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal-700" style={{ width: percentage + "%" }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs"><span className="text-slate-500">Budget consumed</span><span className="font-bold text-teal-700">{percentage}%</span></div>
    </section>
  );
}

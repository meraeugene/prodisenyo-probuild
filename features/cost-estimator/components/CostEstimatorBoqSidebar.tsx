import styles from "@/components/workspace/workspace.module.css";
import { formatBudgetMoney, formatEstimateDateTime } from "../utils/costEstimatorFormatters";
import type { ProjectEstimateRow } from "../types";

export default function CostEstimatorBoqSidebar({ estimate, budgetCeiling }: { estimate: ProjectEstimateRow; budgetCeiling: number | null }) {
  const cost = Number(estimate.estimate_total ?? 0);
  const remaining = budgetCeiling === null ? null : budgetCeiling - cost;
  const usage = budgetCeiling && budgetCeiling > 0 ? Math.round(cost / budgetCeiling * 100) : null;
  const returned = estimate.status === "rejected";
  const status = estimate.status === "submitted" ? "Awaiting CEO review" : estimate.status === "approved" ? "Approved by CEO" : returned ? "Returned for correction" : "Draft estimate";
  return <aside className="min-w-0 space-y-5">
    <section className={styles.panel}><div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Budget summary</h2></div><div className="p-5">
      <dl className="space-y-4 text-sm">{[{ label: "Estimated cost", value: formatBudgetMoney(cost) }, { label: "Budget ceiling", value: budgetCeiling === null ? "Not recorded" : formatBudgetMoney(budgetCeiling) }, { label: "Remaining budget", value: remaining === null ? "Unavailable" : formatBudgetMoney(remaining) }].map(fact => <div key={fact.label} className="flex justify-between gap-3"><dt className="text-slate-500">{fact.label}</dt><dd className={`break-words text-right font-medium ${fact.label === "Remaining budget" && remaining !== null && remaining < 0 ? "text-rose-700" : "text-slate-800"}`}>{fact.value}</dd></div>)}</dl>
      <div className="mt-5 border-t border-slate-100 pt-4"><div className="flex justify-between text-xs text-slate-500"><span>Budget usage</span><span>{usage === null ? "Unavailable" : `${usage}%`}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={usage !== null && usage > 100 ? "h-full bg-rose-600" : "h-full bg-[#076d69]"} style={{ width: `${Math.min(100, Math.max(0, usage ?? 0))}%` }} /></div></div>
    </div></section>
    <section id="submission-status" className={styles.panel}><div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Review status</h2></div><div className="space-y-3 p-5">
      <p className={`text-sm font-medium ${returned ? "text-rose-700" : "text-[#076d69]"}`}>{status}</p><p className="text-xs text-slate-500">Updated {formatEstimateDateTime(estimate.updated_at)}</p>
      {returned && <div className="rounded border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-900">CEO review notes</p><p className="mt-2 break-words text-sm leading-6 text-amber-800">{estimate.rejection_reason?.trim() || "No additional notes were provided."}</p></div>}
      {estimate.notes && <div className="border-t border-slate-100 pt-3"><p className="text-xs text-slate-500">Estimate notes</p><p className="mt-1 text-sm leading-6 text-slate-700">{estimate.notes}</p></div>}
    </div></section>
  </aside>;
}

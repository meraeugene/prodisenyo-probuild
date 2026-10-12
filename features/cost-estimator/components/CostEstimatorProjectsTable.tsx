import { ArrowUpRight } from "lucide-react";
import styles from "@/components/workspace/workspace.module.css";
import { formatBudgetMoney, formatEstimateStatusLabel, getEstimateStatusBadgeClass } from "../utils/costEstimatorFormatters";
import { countEstimateBoqItems, type EstimatePortfolioEntry } from "../utils/estimatePortfolio";

function EstimateStatus({ entry }: { entry: EstimatePortfolioEntry }) {
  return <span className={`inline-flex whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium ${entry.estimate ? getEstimateStatusBadgeClass(entry.estimate.status) : "bg-slate-100 text-slate-600"}`}>{entry.estimate ? formatEstimateStatusLabel(entry.estimate.status) : "Not started"}</span>;
}

function BudgetCell({ entry }: { entry: EstimatePortfolioEntry }) {
  const budget = entry.project?.budgetCeiling;
  const overBudget = budget !== undefined && entry.cost !== null && entry.cost > budget;
  return <div><p className={overBudget ? "font-medium text-rose-700" : "font-medium text-slate-800"}>{entry.cost === null ? "Not estimated" : formatBudgetMoney(entry.cost)}</p>{overBudget && <p className="mt-1 text-xs text-rose-600">Over budget by {formatBudgetMoney(entry.cost! - budget!)}</p>}</div>;
}

export default function CostEstimatorProjectsTable({ entries, pending, hasFilters, onOpen }: {
  entries: EstimatePortfolioEntry[]; pending: boolean; hasFilters: boolean; onOpen: (entry: EstimatePortfolioEntry) => void;
}) {
  if (!entries.length) return <div className={styles.empty}><p className="font-medium text-slate-800">{hasFilters ? "No matching estimates" : "No projects assigned for cost estimation"}</p><p className="mx-auto mt-2 max-w-md leading-6">{hasFilters ? "Try a different search or reset your filters." : "Planning projects will appear here when the CEO assigns them to you."}</p></div>;
  function openButton(entry: EstimatePortfolioEntry) {
    const label = entry.estimate ? entry.status === "draft" ? "Continue draft" : entry.status === "rejected" ? "Review returned BOQ" : "View BOQ" : "Start estimate";
    return <button type="button" disabled={pending} onClick={() => onOpen(entry)} aria-label={`${label} for ${entry.name}`} className={`${entry.estimate ? styles.button : styles.primaryButton} whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50`}>{label}<ArrowUpRight size={14} aria-hidden="true" /></button>;
  }
  return <>
    <div className="hidden overflow-x-auto lg:block"><table className={`${styles.table} !min-w-[980px]`}>
      <thead><tr><th className="w-[28%]">Project</th><th>Status</th><th className="text-right">BOQ items</th><th>Estimated cost</th><th>Budget ceiling</th><th className="text-right">Actions</th></tr></thead>
      <tbody>{entries.map(entry => <tr key={entry.id}><td><p className="font-medium text-slate-900">{entry.name}</p><p className="mt-1 text-xs text-slate-500">{entry.location || "Location not recorded"}</p></td><td><EstimateStatus entry={entry} /></td><td className="text-right text-slate-600">{entry.estimate ? countEstimateBoqItems(entry.items) : "—"}</td><td><BudgetCell entry={entry} /></td><td className="text-slate-600">{entry.project ? formatBudgetMoney(entry.project.budgetCeiling) : "Not recorded"}</td><td className="text-right">{openButton(entry)}</td></tr>)}</tbody>
    </table></div>
    <div className="divide-y divide-slate-100 lg:hidden">{entries.map(entry => <article key={entry.id} className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words text-sm font-semibold text-slate-900">{entry.name}</h2><p className="mt-1 text-xs text-slate-500">{entry.location || "Location not recorded"}</p></div><EstimateStatus entry={entry} /></div>
      <div className="grid grid-cols-2 gap-4 text-xs"><div><p className="mb-1 text-slate-500">Estimated cost</p><BudgetCell entry={entry} /></div><div><p className="mb-1 text-slate-500">Budget ceiling</p><p className="font-medium text-slate-800">{entry.project ? formatBudgetMoney(entry.project.budgetCeiling) : "Not recorded"}</p></div></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">{entry.estimate ? `${countEstimateBoqItems(entry.items)} BOQ items` : "BOQ not started"}</p>{openButton(entry)}</div>
    </article>)}</div>
  </>;
}

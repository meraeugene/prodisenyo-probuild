import Link from "next/link";
import type { GmeaProject } from "../types";
import {
  contractCollectionSummary,
  formatMoney,
  projectSummary,
} from "../utils/gmeaCalculations";
import { getCollectionStatus } from "../utils/ceoPortfolio";

const statusStyles: Record<string, string> = {
  "Fully collected": "text-emerald-700",
  "Partially collected": "text-blue-700",
  Uncollected: "text-amber-700",
  "No contract amount": "text-slate-500",
};

export default function CeoGmeaProjectsTable({ projects }: { projects: GmeaProject[] }) {
  const totals = projects.reduce(
    (result, project) => {
      const summary = projectSummary(project);
      const collection = contractCollectionSummary(project);
      result.contract += summary.contract;
      result.expenses += summary.expenses;
      result.collected += collection.received;
      result.outstanding += collection.outstanding;
      return result;
    },
    { contract: 0, expenses: 0, collected: 0, outstanding: 0 },
  );
  const totalProgress = totals.contract > 0
    ? Math.min(100, Math.round((totals.collected / totals.contract) * 100))
    : 0;

  return (
    <div className="overflow-x-auto border-t border-slate-200">
      <div className="min-w-[1120px]">
        <div className="grid grid-cols-[1.1fr_1.2fr_.9fr_.9fr_.9fr_.9fr_1.2fr_.8fr_.65fr] gap-4 border-b border-slate-200 px-4 py-3 text-[10px] font-semibold text-slate-500">
          <span>Project</span><span>Client / Location</span><span>Contract Amount</span><span>Total Expenses</span><span>Collected Amount</span><span>Outstanding</span><span>Collection Progress</span><span>Status</span><span>View</span>
        </div>
        <div className="divide-y divide-slate-100">
          {projects.map((project) => {
            const summary = projectSummary(project);
            const collection = contractCollectionSummary(project);
            const progress = summary.contract > 0
              ? Math.min(100, Math.round((collection.received / summary.contract) * 100))
              : 0;
            const status = getCollectionStatus(project);
            return (
              <div key={project.id} className="grid grid-cols-[1.1fr_1.2fr_.9fr_.9fr_.9fr_.9fr_1.2fr_.8fr_.65fr] items-center gap-4 px-4 py-3 text-[11px] hover:bg-slate-50/70">
                <div className="min-w-0"><p className="truncate font-semibold text-slate-950">{project.name}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">GMEA-{project.id.slice(0, 8).toUpperCase()}</p></div>
                <div className="min-w-0"><p className="truncate font-medium text-slate-800">{project.client || "Client not set"}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">{project.location || "Location not set"}</p></div>
                <strong className="truncate font-semibold text-slate-900 tabular-nums">{formatMoney(summary.contract)}</strong>
                <strong className="truncate font-semibold text-slate-900 tabular-nums">{formatMoney(summary.expenses)}</strong>
                <strong className="truncate font-semibold text-slate-900 tabular-nums">{formatMoney(collection.received)}</strong>
                <strong className="truncate font-semibold text-slate-900 tabular-nums">{formatMoney(collection.outstanding)}</strong>
                <div><p className="font-semibold text-slate-700">{progress}%</p><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} /></div></div>
                <span className={`truncate font-semibold ${statusStyles[status]}`}>{status}</span>
                <Link href={`/gmea-projects/${project.id}`} className="font-semibold text-blue-700 hover:text-blue-900">View details</Link>
              </div>
            );
          })}
        </div>
        {projects.length ? (
          <div className="grid grid-cols-[1.1fr_1.2fr_.9fr_.9fr_.9fr_.9fr_1.2fr_.8fr_.65fr] items-center gap-4 border-t border-slate-200 bg-slate-50/35 px-4 py-4 text-[11px]">
            <strong className="col-span-2 text-slate-900">Total ({projects.length} projects)</strong>
            <strong>{formatMoney(totals.contract)}</strong><strong>{formatMoney(totals.expenses)}</strong><strong>{formatMoney(totals.collected)}</strong><strong>{formatMoney(totals.outstanding)}</strong>
            <div><strong>{totalProgress}%</strong><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${totalProgress}%` }} /></div></div>
            <span /><span />
          </div>
        ) : <p className="py-14 text-center text-sm text-slate-500">No projects found.</p>}
      </div>
    </div>
  );
}

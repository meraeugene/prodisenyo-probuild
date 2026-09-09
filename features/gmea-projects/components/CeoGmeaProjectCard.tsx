import Link from "next/link";
import { ArrowRight, FolderClosed, MapPin, UserRound } from "lucide-react";
import type { GmeaProject } from "../types";
import { contractCollectionSummary, formatMoney, projectSummary } from "../utils/gmeaCalculations";
import { getCollectionStatus } from "../utils/ceoPortfolio";

export default function CeoGmeaProjectCard({ project }: { project: GmeaProject }) {
  const summary = projectSummary(project);
  const collection = contractCollectionSummary(project);
  const percentage = summary.contract > 0 ? Math.min(100, Math.round(collection.received / summary.contract * 100)) : 0;
  return (
    <Link href={`/gmea-projects/${project.id}`} aria-label={`View details: ${project.name}`} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_-25px_rgba(15,23,42,.2)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_18px_40px_-25px_rgba(15,23,42,.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">
      <div className="flex-1 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><FolderClosed size={20} /></span>
          <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-700">{getCollectionStatus(project)}</span>
        </div>
        <h3 className="mt-4 break-words text-sm font-bold leading-5 text-slate-950">{project.name}</h3>
        <p className="mt-3 flex items-start gap-2 text-xs text-slate-500"><UserRound size={13} className="shrink-0" /><span>{project.client || "Client not set"}</span></p>
        <p className="mt-2 flex items-start gap-2 text-xs text-slate-500"><MapPin size={13} className="shrink-0" /><span>{project.location || "Location not set"}</span></p>
        <div className="mt-5">
          <div className="flex justify-between text-[11px]"><span className="text-slate-500">Contract collected</span><strong className="text-slate-800">{percentage}%</strong></div>
          <div role="progressbar" aria-label="Contract collected" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-700" style={{ width: `${percentage}%` }} /></div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div><p className="text-[10px] text-slate-500">Contract Amount</p><p className="mt-1 break-words text-sm font-bold tracking-tight text-slate-950">{formatMoney(summary.contract)}</p></div>
          <div><p className="text-[10px] text-slate-500">Expenses</p><p className="mt-1 break-words text-sm font-bold tracking-tight text-slate-950">{formatMoney(summary.expenses)}</p></div>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-4 text-xs font-bold text-teal-700 transition group-hover:bg-teal-50">
        View Details <ArrowRight size={14} />
        {project.expenses.some((expense) => expense.is_new) && <span className="ml-auto rounded-full bg-teal-50 px-2 py-1 text-[10px]">New expenses</span>}
      </div>
    </Link>
  );
}

import Link from "next/link";
import {
  LuArrowUpRight as ArrowUpRight,
  LuBriefcaseBusiness as BriefcaseBusiness,
  LuMapPin as MapPin,
  LuUserRound as UserRound,
} from "react-icons/lu";
import type { GmeaProject } from "../types";
import { formatMoney, projectSummary } from "../utils/gmeaCalculations";
import GmeaProjectActionsMenu from "./GmeaProjectActionsMenu";

export default function GmeaProjectPortfolioCard({
  project,
  canEdit,
  onDetails,
}: {
  project: GmeaProject;
  canEdit: boolean;
  onDetails: () => void;
}) {
  const summary = projectSummary(project);
  const hasNewExpense = !canEdit && project.expenses.some((expense) => expense.is_new);

  return (
    <article className="group relative isolate flex min-w-0 flex-col overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-[0_14px_36px_-28px_rgba(15,23,42,.38)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_-27px_rgba(15,23,42,.45)]">
      <div className="flex-1 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#dcf7f1] text-[#087d76]"><BriefcaseBusiness size={18} aria-hidden="true" /></span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8faf4] px-3 py-1 text-[11px] font-semibold text-[#08775f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0b9f7d]" />
              {hasNewExpense ? "New expense" : "Active"}
            </span>
            {canEdit && <GmeaProjectActionsMenu project={project} />}
          </div>
        </div>

        <h2 className="mt-3.5 line-clamp-2 min-h-[20px] text-[15px] font-bold leading-5 tracking-[-0.02em] text-slate-950">{project.name}</h2>
        <div className="mt-2 space-y-1 text-[12px] text-slate-500">
          <p className="flex items-center gap-2"><UserRound size={13} aria-hidden="true" /><span className="truncate">{project.client || "Client not set"}</span></p>
          <p className="flex items-center gap-2"><MapPin size={13} aria-hidden="true" /><span className="truncate">{project.location}</span></p>
        </div>

        <div className="mt-4 grid grid-cols-2 border-t border-slate-100 pt-3.5">
          <div className="min-w-0 border-r border-slate-100 pr-4">
            <p className="text-[11px] text-slate-500">Contract amount</p>
            <p className="mt-0.5 truncate text-[17px] font-bold tracking-[-0.025em] text-slate-950 tabular-nums">{formatMoney(summary.contract)}</p>
          </div>
          <div className="min-w-0 pl-5">
            <p className="text-[11px] text-slate-500">Expenses</p>
            <p className="mt-0.5 truncate text-[14px] font-bold text-slate-900 tabular-nums">{formatMoney(summary.expenses)}</p>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50/55 px-5 py-3">
        <Link aria-label={`Open project: ${project.name}`} className="inline-flex items-center gap-2 text-[12px] font-bold text-[#08746f] after:absolute after:inset-0 after:z-10 after:rounded-[16px] after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-teal-700" href={`/gmea-projects/${project.id}`}>
          Open project <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
        <button type="button" className="relative z-20 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700" onClick={onDetails}>Details</button>
      </footer>
    </article>
  );
}

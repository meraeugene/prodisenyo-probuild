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
    <article className="group relative isolate flex min-w-0 flex-col overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)] transition-shadow duration-200 hover:shadow-[0_14px_32px_-20px_rgba(15,23,42,.38)]">
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <BriefcaseBusiness size={14} className="shrink-0 text-[#087d76]" aria-hidden="true" />
            <h2 className="truncate text-[16px] font-bold leading-5 tracking-[-0.02em] text-slate-950">{project.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8faf4] px-3 py-1 text-[11px] font-semibold text-[#08775f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0b9f7d]" />
              {hasNewExpense ? "New expense" : "Active"}
            </span>
            {canEdit && <GmeaProjectActionsMenu project={project} />}
          </div>
        </div>

        <div className="mt-3 grid gap-1.5 text-[13px] text-slate-500 sm:grid-cols-2">
          <p className="flex items-center gap-2"><UserRound size={13} aria-hidden="true" /><span className="truncate">{project.client || "Client not set"}</span></p>
          <p className="flex items-center gap-2"><MapPin size={13} aria-hidden="true" /><span className="truncate">{project.location}</span></p>
        </div>

        <div className="mt-4 grid grid-cols-2 border-t border-slate-100 pt-3.5">
          <div className="min-w-0 border-r border-slate-100 pr-4">
            <p className="text-[12px] text-slate-500">Contract amount</p>
            <p className="mt-1 truncate text-[18px] font-semibold tracking-[-0.025em] text-slate-950 tabular-nums">{formatMoney(summary.contract)}</p>
          </div>
          <div className="min-w-0 pl-4">
            <p className="text-[12px] text-slate-500">Expenses</p>
            <p className="mt-1 truncate text-[16px] font-semibold text-slate-900 tabular-nums">{formatMoney(summary.expenses)}</p>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50/45 px-5 py-3">
        <Link aria-label={`Open project: ${project.name}`} className="inline-flex items-center gap-2 text-[13px] font-bold text-[#08746f] after:absolute after:inset-0 after:z-10 after:rounded-[16px] after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-teal-700" href={`/gmea-projects/${project.id}`}>
          Open project <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
        <button type="button" className="relative z-20 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700" onClick={onDetails}>Details</button>
      </footer>
    </article>
  );
}

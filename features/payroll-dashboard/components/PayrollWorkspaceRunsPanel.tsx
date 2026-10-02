"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, FileText, MapPin } from "lucide-react";
import type { PayrollDashboardRunStatus, PayrollWorkspaceRun } from "@/features/payroll-dashboard/types";
import { formatPayrollCurrency, formatPayrollDate } from "@/features/payroll-dashboard/utils/payrollDashboard";

type Filter = "draft" | "approved" | "all";

const STATUS_LABELS: Record<PayrollDashboardRunStatus, string> = {
  draft: "Draft",
  submitted: "Awaiting CEO",
  approved: "Approved",
  rejected: "Returned",
};

const STATUS_STYLES: Record<PayrollDashboardRunStatus, string> = {
  draft: "bg-sky-50 text-sky-700",
  submitted: "bg-violet-50 text-violet-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
};

function runHref(run: PayrollWorkspaceRun) {
  if ((run.status === "draft" || run.status === "rejected") && run.attendanceImportId) {
    const query = new URLSearchParams({ importId: run.attendanceImportId, runId: run.id });
    return `/generate-payroll?${query.toString()}`;
  }
  return `/payroll-analytics?runId=${encodeURIComponent(run.id)}`;
}

export default function PayrollWorkspaceRunsPanel({ runs }: { runs: PayrollWorkspaceRun[] }) {
  const [filter, setFilter] = useState<Filter>("draft");
  const counts = useMemo(() => ({
    draft: runs.filter((run) => run.status === "draft").length,
    approved: runs.filter((run) => run.status === "approved").length,
    all: runs.length,
  }), [runs]);
  const visibleRuns = useMemo(
    () => filter === "all" ? runs : runs.filter((run) => run.status === filter),
    [filter, runs],
  );

  return (
    <section className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-950">Active Payrolls</h2>
          <p className="mt-1 text-sm text-slate-500">{runs.length.toLocaleString("en-PH")} payroll records in this workspace</p>
        </div>
        <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-slate-50 p-1">
          {(["draft", "approved", "all"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-3.5 py-2 text-xs font-bold capitalize transition ${filter === item ? "bg-white text-teal-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              {item === "draft" ? "Drafts" : item} ({counts[item]})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 min-h-[310px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_26px_rgba(15,23,42,0.035)] sm:p-5">
        {visibleRuns.length ? (
          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {visibleRuns.map((run) => (
              <article key={run.id} className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_12px_30px_rgba(8,118,111,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLES[run.status]}`}>{STATUS_LABELS[run.status]}</span>
                  <FileText size={17} className="text-slate-300" />
                </div>
                <div className="mt-4 flex items-start gap-2 text-sm font-bold text-slate-950"><CalendarDays size={16} className="mt-0.5 shrink-0 text-teal-700" /><span>{run.periodLabel}</span></div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500"><MapPin size={14} className="shrink-0" /><span className="truncate">{run.siteName}</span></div>
                <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total payroll</p>
                    <p className="mt-1 text-lg font-bold tracking-[-0.03em] text-slate-950">{formatPayrollCurrency(run.netTotal)}</p>
                    <p className="mt-1 text-[10px] text-slate-400">Updated {formatPayrollDate(run.updatedAt)}</p>
                  </div>
                  <Link href={runHref(run)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-teal-700 px-3 text-xs font-bold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
                    {run.status === "draft" || run.status === "rejected" ? "Open Payroll" : "View Payroll"}<ArrowUpRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-[270px] place-items-center text-center">
            <div className="max-w-sm">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><FileText size={20} /></span>
              <h3 className="mt-4 text-sm font-bold text-slate-900">No {filter === "all" ? "payroll records" : `${filter} payrolls`} yet</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">New payroll work begins by uploading an attendance file.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

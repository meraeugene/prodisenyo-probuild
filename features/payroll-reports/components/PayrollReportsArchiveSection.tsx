"use client";

import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  formatPayrollReportCompactDateTime,
  formatPayrollReportPeriodLabel,
  formatPayrollReportPeso,
  getPayrollReportStatusLabel,
} from "@/features/payroll-reports/utils/payrollReportHelpers";
import type {
  PayrollRunRow,
  ReportActionsMenuState,
} from "@/features/payroll-reports/types";

export default function PayrollReportsArchiveSection({
  reports,
  refreshing,
  deletingRunId,
  pendingDecisionRunId,
  pendingDecisionAction,
  openMenu,
  openMenuReport,
  deleteConfirmReport,
  rejectConfirmReport,
  rejectionReason,
  onToggleMenu,
  onViewReport,
  onApproveReport,
  onRejectReport,
  onAskDelete,
  onCloseRejectConfirm,
  onRejectionReasonChange,
  onConfirmReject,
  onCloseDeleteConfirm,
  onDeleteReport,
}: {
  reports: PayrollRunRow[];
  refreshing: boolean;
  deletingRunId: string | null;
  pendingDecisionRunId: string | null;
  pendingDecisionAction: "approve" | "reject" | null;
  openMenu: ReportActionsMenuState | null;
  openMenuReport: PayrollRunRow | null;
  deleteConfirmReport: PayrollRunRow | null;
  rejectConfirmReport: PayrollRunRow | null;
  rejectionReason: string;
  onToggleMenu: (report: PayrollRunRow, rect: DOMRect) => void;
  onViewReport: (report: PayrollRunRow) => void;
  onApproveReport: (report: PayrollRunRow) => void;
  onRejectReport: (report: PayrollRunRow) => void;
  onAskDelete: (report: PayrollRunRow) => void;
  onCloseRejectConfirm: () => void;
  onRejectionReasonChange: (value: string) => void;
  onConfirmReject: () => void;
  onCloseDeleteConfirm: () => void;
  onDeleteReport: (report: PayrollRunRow) => void;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [sort, setSort] = useState("latest");
  const periods = useMemo(
    () => [...new Set(reports.map(formatPayrollReportPeriodLabel))],
    [reports],
  );
  const sites = useMemo(
    () => [...new Set(reports.map((report) => report.site_name).filter(Boolean))].sort(),
    [reports],
  );
  const visibleReports = useMemo(() => {
    const term = query.trim().toLowerCase();
    return reports
      .filter((report) => {
        const matchesStatus = statusFilter === "all" || report.status === statusFilter;
        const matchesPeriod = periodFilter === "all" || formatPayrollReportPeriodLabel(report) === periodFilter;
        const matchesSite = siteFilter === "all" || report.site_name === siteFilter;
        const matchesQuery = !term || report.site_name.toLowerCase().includes(term) || formatPayrollReportPeriodLabel(report).toLowerCase().includes(term);
        return matchesStatus && matchesPeriod && matchesSite && matchesQuery;
      })
      .sort((left, right) => sort === "value" ? Number(right.net_total) - Number(left.net_total) : Date.parse(right.submitted_at ?? right.created_at) - Date.parse(left.submitted_at ?? left.created_at));
  }, [periodFilter, query, reports, siteFilter, sort, statusFilter]);
  const statusCounts = {
    all: reports.length,
    submitted: reports.filter((report) => report.status === "submitted").length,
    approved: reports.filter((report) => report.status === "approved").length,
    rejected: reports.filter((report) => report.status === "rejected").length,
  };

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-end xl:justify-between">
          <nav aria-label="Filter payroll reports by status" className="flex max-w-full flex-wrap gap-1">
            {[["all", "All Payroll Runs"], ["submitted", "Pending Review"], ["approved", "Approved"], ["rejected", "Returned"]].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`shrink-0 border-b-2 px-3 py-3 text-xs font-semibold ${statusFilter === value ? "border-emerald-600 text-slate-900" : "border-transparent text-slate-500"}`}>{label} ({statusCounts[value as keyof typeof statusCounts]})</button>
            ))}
          </nav>
          <div className="grid gap-2 sm:grid-cols-[minmax(210px,1fr)_150px_150px_150px]">
            <input aria-label="Search payroll reports" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search payroll runs, site, or period" className="h-9 min-w-0 rounded-lg border border-slate-200 px-3 text-[11px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <select aria-label="Payroll period" value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px]"><option value="all">All Periods</option>{periods.map((period) => <option key={period} value={period}>{period}</option>)}</select>
            <select aria-label="Project site" value={siteFilter} onChange={(event) => setSiteFilter(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px]"><option value="all">All Sites</option>{sites.map((site) => <option key={site} value={site}>{site}</option>)}</select>
            <select aria-label="Sort payroll reports" value={sort} onChange={(event) => setSort(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px]"><option value="latest">Latest Submitted</option><option value="value">Highest Net Payroll</option></select>
          </div>
          {refreshing ? <span className="sr-only" role="status">Refreshing payroll reports</span> : null}
        </div>

        {visibleReports.length === 0 ? (
          <p className="border-t border-slate-200 py-12 text-center text-sm text-slate-500">No payroll reports match these filters.</p>
        ) : (
          <div className="overflow-visible border-t border-slate-200">
            <table className="w-full table-fixed text-[10px] xl:text-[11px]">
              <colgroup>
                <col className="w-[10%]" /><col className="w-[15%]" /><col className="w-[9%]" />
                <col className="w-[8%]" /><col className="w-[6%]" /><col className="w-[11%]" />
                <col className="w-[10%]" /><col className="w-[11%]" /><col className="w-[11%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50/40 text-left text-[9px] font-semibold uppercase tracking-[0.04em] text-slate-400">
                  <th className="whitespace-nowrap px-2.5 py-3">Submitted Date</th><th className="whitespace-nowrap px-2.5 py-3">Payroll Period</th><th className="truncate px-2.5 py-3">Project Site</th><th className="whitespace-nowrap px-2.5 py-3 text-right">Employees</th><th className="truncate px-2.5 py-3 text-right">Hours</th><th className="truncate px-2.5 py-3 text-right">Gross Payroll</th><th className="truncate px-2.5 py-3 text-right">Deductions</th><th className="truncate px-2.5 py-3 text-right">Net Payroll</th><th className="truncate px-2.5 py-3">Status</th><th className="truncate px-2.5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleReports.map((report) => (
                  <tr key={report.id} className="bg-white hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-2.5 py-3 text-slate-600">{formatPayrollReportCompactDateTime(report.submitted_at ?? report.created_at)}</td>
                    <td className="whitespace-nowrap px-2.5 py-3 font-medium text-slate-800">{formatPayrollReportPeriodLabel(report)}</td>
                    <td className="truncate px-2.5 py-3 text-slate-600">{report.site_name}</td>
                    <td className="whitespace-nowrap px-2.5 py-3 text-right text-slate-700">{report.employee_count}</td>
                    <td className="truncate px-2.5 py-3 text-right text-slate-700">{report.hours_worked.toLocaleString("en-PH", { maximumFractionDigits: 2 })}</td>
                    <td className="truncate px-2.5 py-3 text-right font-semibold text-slate-900">{formatPayrollReportPeso(report.gross_total ?? 0)}</td>
                    <td className="truncate px-2.5 py-3 text-right text-slate-700">{formatPayrollReportPeso(report.deductions_total)}</td>
                    <td className="truncate px-2.5 py-3 text-right font-semibold text-slate-900">{formatPayrollReportPeso(report.net_total ?? 0)}</td>
                    <td className="truncate px-2.5 py-3"><span className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap font-semibold ${report.status === "approved" ? "text-emerald-700" : report.status === "submitted" ? "text-blue-700" : "text-amber-700"}`}><i className="h-2 w-2 shrink-0 rounded-full bg-current" /><span className="truncate">{getPayrollReportStatusLabel(report.status)}</span></span></td>
                    <td className="truncate px-2.5 py-3">
                      <button
                        type="button"
                        onClick={(event) =>
                          onToggleMenu(
                            report,
                            event.currentTarget.getBoundingClientRect(),
                          )
                        }
                        data-report-actions-root
                        className="font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-60"
                        aria-label="Open report actions"
                        disabled={
                          deletingRunId === report.id ||
                          pendingDecisionRunId === report.id
                        }
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {openMenu && openMenuReport
        ? createPortal(
            <div
              data-report-actions-root
              className="fixed z-[140] min-w-[170px] -translate-x-full overflow-hidden rounded-lg border border-apple-mist bg-white text-left shadow-[0_14px_36px_rgba(16,24,40,0.18)]"
              style={{ top: openMenu.top, left: openMenu.left }}
            >
              <button
                type="button"
                onClick={() => onViewReport(openMenuReport)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-apple-charcoal transition hover:bg-teal-50 hover:text-teal-800"
              >
                View Reports
              </button>
              {openMenuReport.status === "submitted" ? (
                <>
                  <button
                    type="button"
                    onClick={() => onApproveReport(openMenuReport)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={pendingDecisionRunId === openMenuReport.id}
                  >
                    {pendingDecisionRunId === openMenuReport.id &&
                    pendingDecisionAction === "approve"
                      ? "Updating..."
                      : "Approve Payroll"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRejectReport(openMenuReport)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={pendingDecisionRunId === openMenuReport.id}
                  >
                    {pendingDecisionRunId === openMenuReport.id &&
                    pendingDecisionAction === "reject"
                      ? "Updating..."
                      : "Return Payroll"}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => onAskDelete(openMenuReport)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  deletingRunId === openMenuReport.id ||
                  pendingDecisionRunId === openMenuReport.id
                }
              >
                {deletingRunId === openMenuReport.id
                  ? "Deleting..."
                  : "Delete Payroll"}
              </button>
            </div>,
            document.body,
          )
        : null}

      {deleteConfirmReport
        ? createPortal(
            <div
              className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  deletingRunId !== deleteConfirmReport.id
                ) {
                  onCloseDeleteConfirm();
                }
              }}
            >
              <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(15,23,42,0.26)]">
                <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#063b38,#075f5b,#087a75)] px-5 py-4 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                    Confirm Delete
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
                    Delete Payroll Report?
                  </h3>
                </div>
                <div className="space-y-4 px-5 py-4">
                  <p className="text-sm text-apple-charcoal">
                    Delete payroll report for{" "}
                    <span className="font-semibold">
                      {formatPayrollReportPeriodLabel(deleteConfirmReport)}
                    </span>
                    ? This cannot be undone.
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onCloseDeleteConfirm}
                      disabled={deletingRunId === deleteConfirmReport.id}
                      className="inline-flex h-9 items-center rounded-lg border border-apple-mist bg-white px-3 text-sm font-semibold text-apple-charcoal transition hover:border-apple-steel disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteReport(deleteConfirmReport)}
                      disabled={deletingRunId === deleteConfirmReport.id}
                      className="inline-flex h-9 items-center rounded-lg bg-rose-600 px-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingRunId === deleteConfirmReport.id ? (
                        <>
                          <LoaderCircle
                            size={15}
                            className="mr-2 animate-spin"
                          />
                          Deleting...
                        </>
                      ) : (
                        "Delete Payroll"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {rejectConfirmReport
        ? createPortal(
            <div
              className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  pendingDecisionRunId !== rejectConfirmReport.id
                ) {
                  onCloseRejectConfirm();
                }
              }}
            >
              <div className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.24)]">
                <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#063b38,#075f5b,#087a75)] px-5 py-4 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
                    Return Payroll
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">
                    Send this payroll report back to HR
                  </h2>
                </div>

                <div className="space-y-4 px-5 py-5">
                  <p className="text-sm text-apple-steel">
                    Add an optional return note for{" "}
                    <span className="font-semibold text-apple-charcoal">
                      {formatPayrollReportPeriodLabel(rejectConfirmReport)}
                    </span>
                    .
                  </p>
                  <textarea
                    value={rejectionReason}
                    onChange={(event) =>
                      onRejectionReasonChange(event.target.value)
                    }
                    rows={5}
                    placeholder="Add an optional return note for HR."
                    className="w-full rounded-2xl border border-apple-mist px-3 py-3 text-sm text-apple-charcoal outline-none transition focus:border-[#076d69]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onCloseRejectConfirm}
                      disabled={pendingDecisionRunId === rejectConfirmReport.id}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-apple-mist px-4 text-sm font-semibold text-apple-charcoal transition hover:border-teal-200 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onConfirmReject}
                      disabled={pendingDecisionRunId === rejectConfirmReport.id}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-[#527d79] px-4 text-sm font-semibold text-white transition hover:bg-[#527d79] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingDecisionRunId === rejectConfirmReport.id &&
                      pendingDecisionAction === "reject" ? (
                        <>
                          <LoaderCircle
                            size={15}
                            className="mr-2 animate-spin"
                          />
                          Returning...
                        </>
                      ) : (
                        "Confirm Return"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

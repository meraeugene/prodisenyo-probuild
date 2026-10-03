"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";

import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import PayrollReportCharts from "./PayrollReportCharts";
import { lockBodyScroll } from "../utils/modalScrollLock";
import EmployeeLogsModal from "@/features/payroll-reports/components/EmployeeLogsModal";
import { cn } from "@/lib/utils";
import {
  PayrollReportDashboardSkeleton,
} from "@/features/payroll-reports/components/PayrollReportUiBits";
import {
  buildPayrollReportDailyTrend,
  buildPayrollReportSiteDistribution,
  buildPayrollReportSiteSummaries,
  formatPayrollReportDateTime,
  formatPayrollReportPeriodLabel,
  formatPayrollReportPeso,
  normalizePayrollReportKey,
  splitPayrollReportSiteNames,
} from "@/features/payroll-reports/utils/payrollReportHelpers";
import type {
  PayrollRunRow,
  ReportDetailsState,
} from "@/features/payroll-reports/types";

const PAYROLL_PAGE_SIZE = 10;



export default function PayrollReportModal({
  report,
  details,
  onClose,
  onRefresh,
}: {
  report: PayrollRunRow;
  details: ReportDetailsState | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("all");
  const [payrollPage, setPayrollPage] = useState(1);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const unlockBodyScroll = lockBodyScroll();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      unlockBodyScroll();
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const updateIsMobile = () => setIsMobile(media.matches);
    updateIsMobile();

    media.addEventListener("change", updateIsMobile);
    return () => {
      media.removeEventListener("change", updateIsMobile);
    };
  }, []);

  const payrollItems = useMemo(() => details?.payrollItems ?? [], [details?.payrollItems]);
  const attendanceLogs = details?.attendanceLogs ?? [];
  const dailyTotals = useMemo(() => details?.dailyTotals ?? [], [details?.dailyTotals]);
  const activeItem =
    payrollItems.find((item) => item.id === activeItemId) ?? null;

  const siteOptions = useMemo(
    () =>
      Array.from(
        new Set(
          payrollItems.flatMap((item) =>
            splitPayrollReportSiteNames(item.site_name),
          ),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [payrollItems],
  );
  const filteredPayrollItems = useMemo(() => {
    const searchTerm = normalizePayrollReportKey(search);
    return payrollItems.filter((item) => {
      const matchesSearch =
        searchTerm.length === 0 ||
        normalizePayrollReportKey(item.employee_name).includes(searchTerm);
      const matchesSite =
        siteFilter === "all" ||
        splitPayrollReportSiteNames(item.site_name).some(
          (site) =>
            normalizePayrollReportKey(site) ===
            normalizePayrollReportKey(siteFilter),
        );
      return matchesSearch && matchesSite;
    });
  }, [payrollItems, search, siteFilter]);
  useEffect(() => {
    setPayrollPage(1);
  }, [search, siteFilter]);
  const payrollPageCount = Math.max(
    1,
    Math.ceil(filteredPayrollItems.length / PAYROLL_PAGE_SIZE),
  );
  const safePayrollPage = Math.min(payrollPage, payrollPageCount);
  const paginatedPayrollItems = useMemo(() => {
    const startIndex = (safePayrollPage - 1) * PAYROLL_PAGE_SIZE;
    return filteredPayrollItems.slice(
      startIndex,
      startIndex + PAYROLL_PAGE_SIZE,
    );
  }, [filteredPayrollItems, safePayrollPage]);
  const payrollRangeStart =
    filteredPayrollItems.length === 0
      ? 0
      : (safePayrollPage - 1) * PAYROLL_PAGE_SIZE + 1;
  const payrollRangeEnd = Math.min(
    safePayrollPage * PAYROLL_PAGE_SIZE,
    filteredPayrollItems.length,
  );
  const payrollPageNumbers = useMemo(() => {
    const pages = Array.from(
      { length: payrollPageCount },
      (_, index) => index + 1,
    );
    if (payrollPageCount <= 7) return pages;

    const middlePages = pages.filter(
      (page) => Math.abs(page - safePayrollPage) <= 1,
    );
    return Array.from(new Set([1, ...middlePages, payrollPageCount])).sort(
      (a, b) => a - b,
    );
  }, [payrollPageCount, safePayrollPage]);
  const siteSummaries = useMemo(
    () => buildPayrollReportSiteSummaries(payrollItems),
    [payrollItems],
  );
  const dailyTrend = useMemo(
    () => buildPayrollReportDailyTrend(dailyTotals),
    [dailyTotals],
  );
  const siteDistribution = useMemo(
    () => buildPayrollReportSiteDistribution(payrollItems),
    [payrollItems],
  );
  const totalPayroll = useMemo(
    () => payrollItems.reduce((sum, item) => sum + item.total_pay, 0),
    [payrollItems],
  );
  const filteredPayrollTotal = useMemo(
    () => filteredPayrollItems.reduce((sum, item) => sum + item.total_pay, 0),
    [filteredPayrollItems],
  );
  const totalHoursWorked = useMemo(
    () => payrollItems.reduce((sum, item) => sum + item.hours_worked, 0),
    [payrollItems],
  );
  const totalOvertimeHours = useMemo(
    () => payrollItems.reduce((sum, item) => sum + item.overtime_hours, 0),
    [payrollItems],
  );

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-0 backdrop-blur-sm sm:p-3"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div data-workspace className="flex h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none bg-white shadow-workspace-dialog sm:max-h-[95vh] sm:h-auto sm:max-w-[min(1520px,96vw)] sm:rounded-[20px]">
          <div className="border-b border-[#edf3f1] bg-white px-4 py-4 text-[#1d1d1f] sm:px-6 sm:py-5">
            <div className="flex items-start justify-between ">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs font-medium text-[#53736f]">
                  View Reports
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] leading-tight sm:text-xl md:text-2xl">
                  {formatPayrollReportPeriodLabel(report)}
                </h2>
                <p className="mt-2 text-xs text-[#53736f] sm:text-sm">
                  {report.site_name} | {report.status} | Submitted{" "}
                  {formatPayrollReportDateTime(
                    report.submitted_at ?? report.created_at,
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl bg-white p-0 text-[#53736f] transition hover:bg-[#f4faf7]"
                aria-label="Close payroll report modal"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            {!details || details.loading ? (
              <PayrollReportDashboardSkeleton />
            ) : details.error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-semibold text-red-700">
                  {details.error}
                </p>
                <button
                  type="button"
                  onClick={onRefresh}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <WorkspaceSummaryCards ariaLabel="Payroll report summary" className="xl:grid-cols-5" cards={[
 { label: "Employees", value: payrollItems.length.toLocaleString("en-PH") },
 { label: "Total Payroll", value: formatPayrollReportPeso(totalPayroll) },
 { label: "Hours Worked", value: totalHoursWorked.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
 { label: "Overtime Hours", value: totalOvertimeHours.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
 { label: "Attendance Logs", value: attendanceLogs.length.toLocaleString("en-PH") },
 ]} />
 <PayrollReportCharts dailyTrend={dailyTrend} siteSummaries={siteSummaries} siteDistribution={siteDistribution} isMobile={isMobile} />

                <div className="order-2 overflow-hidden rounded-[24px] bg-white shadow-[0_12px_28px_rgba(6,59,56,0.08)]">
                  <div className="border-b border-apple-mist px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                          Employee Payrolls
                        </p>
                      </div>
                      <div className="w-full sm:w-auto">
                        <p className="text-sm font-semibold text-apple-steel sm:text-right">
                          Showing {payrollRangeStart.toLocaleString("en-PH")}-
                          {payrollRangeEnd.toLocaleString("en-PH")} of{" "}
                          {filteredPayrollItems.length.toLocaleString("en-PH")}{" "}
                          filtered employees
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col sm:flex-row items-center gap-2">
                      <div className="relative min-w-[220px] w-full sm:w-fit">
                        
                        <input data-search-field="true"
                          type="search"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search employee..."
                          className="h-9 w-full rounded-lg border border-apple-mist bg-white pl-9 pr-3 text-xs text-apple-charcoal outline-none transition focus:border-[#076d69]"
                        />
                      </div>
                      <select
                        value={siteFilter}
                        onChange={(event) => setSiteFilter(event.target.value)}
                        className="h-9 min-w-[180px] rounded-lg border w-full sm:w-fit border-apple-mist bg-white px-3 text-xs text-apple-charcoal outline-none transition focus:border-[#076d69]"
                      >
                        <option value="all">All Sites</option>
                        {siteOptions.map((site) => (
                          <option key={site} value={site}>
                            {site}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[rgb(var(--apple-snow))]">
                          <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                            Employee
                          </th>
                          <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                            Role
                          </th>
                          <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                            Site
                          </th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">
                            Days
                          </th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">
                            Hours
                          </th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">
                            Rate
                          </th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">
                            Paid
                          </th>
                          <th className="px-3 py-2 text-center font-semibold uppercase tracking-wider text-apple-steel">
                            View
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-apple-mist">
                        {filteredPayrollItems.length > 0 ? (
                          paginatedPayrollItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-3 py-2 font-medium whitespace-nowrap text-apple-charcoal">
                                {item.employee_name}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-apple-smoke">
                                {item.role_code}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-apple-smoke">
                                {item.site_name}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-apple-smoke">
                                {item.days_worked.toLocaleString("en-PH")}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-apple-smoke">
                                {item.hours_worked.toLocaleString("en-PH", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-apple-smoke">
                                {formatPayrollReportPeso(item.rate_per_day)}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold whitespace-nowrap text-apple-charcoal">
                                {formatPayrollReportPeso(item.total_pay)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => setActiveItemId(item.id)}
                                  className="rounded-lg border border-[#076d69] bg-[#076d69] px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-white transition hover:bg-[#0f766e]"
                                >
                                  View Logs
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-3 py-4 text-center text-apple-steel"
                            >
                              No employees match the current filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col gap-3 border-t border-apple-mist px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium text-apple-steel">
                      Page {safePayrollPage.toLocaleString("en-PH")} of{" "}
                      {payrollPageCount.toLocaleString("en-PH")} ·{" "}
                      {PAYROLL_PAGE_SIZE} employees per page
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPayrollPage(1)}
                        disabled={safePayrollPage <= 1}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-apple-mist bg-white px-2.5 text-xs font-semibold text-apple-charcoal transition hover:bg-apple-mist/50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="First payroll page"
                      >
                        First
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPayrollPage((page) => Math.max(page - 1, 1))
                        }
                        disabled={safePayrollPage <= 1}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-apple-mist bg-white px-2.5 text-xs font-semibold text-apple-charcoal transition hover:bg-apple-mist/50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Previous payroll page"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      {payrollPageNumbers.map((page, index) => {
                        const previousPage = payrollPageNumbers[index - 1];
                        const showGap =
                          previousPage !== undefined && page - previousPage > 1;

                        return (
                          <span
                            key={page}
                            className="inline-flex items-center gap-1.5"
                          >
                            {showGap ? (
                              <span className="px-1 text-xs font-semibold text-apple-steel">
                                ...
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setPayrollPage(page)}
                              aria-current={
                                page === safePayrollPage ? "page" : undefined
                              }
                              className={cn(
                                "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-xs font-semibold transition",
                                page === safePayrollPage
                                  ? "border-[#076d69] bg-[#076d69] text-white"
                                  : "border-apple-mist bg-white text-apple-charcoal hover:bg-apple-mist/50",
                              )}
                            >
                              {page.toLocaleString("en-PH")}
                            </button>
                          </span>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() =>
                          setPayrollPage((page) =>
                            Math.min(page + 1, payrollPageCount),
                          )
                        }
                        disabled={safePayrollPage >= payrollPageCount}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-apple-mist bg-white px-2.5 text-xs font-semibold text-apple-charcoal transition hover:bg-apple-mist/50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Next payroll page"
                      >
                        <ChevronRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayrollPage(payrollPageCount)}
                        disabled={safePayrollPage >= payrollPageCount}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-apple-mist bg-white px-2.5 text-xs font-semibold text-apple-charcoal transition hover:bg-apple-mist/50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Last payroll page"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeItem ? (
        <EmployeeLogsModal
          report={report}
          item={activeItem}
          attendanceLogs={attendanceLogs}
          onClose={() => setActiveItemId(null)}
        />
      ) : null}
    </>,
    document.body,
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmployeeLogsModal from "@/features/payroll-reports/components/EmployeeLogsModal";
import {
  PayrollReportAnalyticsTooltip,
  PayrollReportDashboardSkeleton,
  PayrollReportStatCard,
} from "@/features/payroll-reports/components/PayrollReportUiBits";
import {
  PAYROLL_REPORT_SITE_COLORS,
  buildPayrollReportDailyTrend,
  buildPayrollReportSiteDistribution,
  buildPayrollReportSiteSummaries,
  formatPayrollReportCompactValue,
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
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
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

  const payrollItems = details?.payrollItems ?? [];
  const attendanceLogs = details?.attendanceLogs ?? [];
  const dailyTotals = details?.dailyTotals ?? [];
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
        <div className="flex h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none bg-[#f6faf7] shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:max-h-[95vh] sm:h-auto sm:max-w-[min(1520px,96vw)] sm:rounded-[28px]">
          <div className="border-b border-emerald-950/10 bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                  View Reports
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] leading-tight sm:text-xl md:text-2xl">
                  {formatPayrollReportPeriodLabel(report)}
                </h2>
                <p className="mt-2 truncate text-xs whitespace-nowrap text-white/80 sm:text-sm">
                  {report.site_name} | {report.status} | Submitted{" "}
                  {formatPayrollReportDateTime(
                    report.submitted_at ?? report.created_at,
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full border border-white/25 bg-white/10 p-0 text-white transition hover:bg-white/20"
                aria-label="Close payroll report modal"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-6 py-6">
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
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <PayrollReportStatCard
                    label="Employees"
                    value={payrollItems.length.toLocaleString("en-PH")}
                    helper="Included in this submitted report"
                  />
                  <PayrollReportStatCard
                    label="Total Payroll"
                    value={formatPayrollReportPeso(totalPayroll)}
                    helper="Submitted payroll amount"
                  />
                  <PayrollReportStatCard
                    label="Hours Worked"
                    value={totalHoursWorked.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    helper="Total payroll hours"
                  />
                  <PayrollReportStatCard
                    label="Overtime Hours"
                    value={totalOvertimeHours.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    helper="Approved overtime included"
                  />
                  <PayrollReportStatCard
                    label="Attendance Logs"
                    value={attendanceLogs.length.toLocaleString("en-PH")}
                    helper="All report log rows loaded"
                  />
                </div>

                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-apple-mist bg-white">
                    <div className="border-b border-apple-mist px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                        Daily Payroll Trend
                      </p>
                      <p className="mt-1 text-xs text-apple-steel">
                        Paid totals and worked hours across this submitted
                        report.
                      </p>
                    </div>
                    <div className="h-[320px] px-1 py-4 sm:px-3">
                      {dailyTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={dailyTrend}
                            margin={{ top: 14, right: 10, left: 2, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id="payrollReportTrendFill"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#22c55e"
                                  stopOpacity={0.26}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#22c55e"
                                  stopOpacity={0.03}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="4 4"
                              vertical={false}
                              stroke="#d3eee0"
                            />
                            <XAxis
                              dataKey="label"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#5f6875", fontSize: 11 }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#5f6875", fontSize: 11 }}
                              tickFormatter={(value) =>
                                formatPayrollReportCompactValue(Number(value))
                              }
                            />
                            <Tooltip
                              content={(props) => (
                                <PayrollReportAnalyticsTooltip
                                  {...props}
                                  valueFormatter={(value) =>
                                    formatPayrollReportPeso(value)
                                  }
                                />
                              )}
                            />
                            <Area
                              type="monotone"
                              dataKey="paid"
                              name="Paid"
                              stroke="#16a34a"
                              strokeWidth={3.5}
                              fill="url(#payrollReportTrendFill)"
                              dot={false}
                              activeDot={{
                                r: 5,
                                fill: "#16a34a",
                                stroke: "white",
                                strokeWidth: 2,
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-apple-steel">
                          No daily totals were saved for this report yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
                    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-apple-mist bg-white">
                      <div className="border-b border-apple-mist px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                          Site Payroll Breakdown
                        </p>
                      </div>
                      <div className="h-[320px] rounded-[12px] bg-[rgb(var(--apple-snow))] p-2 sm:p-4">
                        {siteSummaries.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={siteSummaries.slice(0, 6)}
                              barCategoryGap="28%"
                              margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="rgb(var(--theme-chart-grid))"
                              />
                              <XAxis
                                dataKey="siteName"
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                tickFormatter={isMobile ? () => "" : undefined}
                                tick={{
                                  fill: "rgb(var(--theme-chart-axis))",
                                  fontSize: 11,
                                }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                  fill: "rgb(var(--theme-chart-axis))",
                                  fontSize: 11,
                                }}
                                tickFormatter={(value) =>
                                  formatPayrollReportCompactValue(Number(value))
                                }
                              />
                              <Tooltip
                                content={(props) => (
                                  <PayrollReportAnalyticsTooltip
                                    {...props}
                                    valueFormatter={(value) =>
                                      formatPayrollReportPeso(value)
                                    }
                                  />
                                )}
                                cursor={{
                                  fill: "rgb(var(--theme-chart-cursor))",
                                }}
                              />
                              <Bar
                                dataKey="payroll"
                                name="Payroll"
                                radius={[6, 6, 6, 6]}
                                barSize={44}
                              >
                                {siteSummaries
                                  .slice(0, 6)
                                  .map((entry, index) => (
                                    <Cell
                                      key={`${entry.siteName}-${index}`}
                                      fill={
                                        PAYROLL_REPORT_SITE_COLORS[
                                          index %
                                            PAYROLL_REPORT_SITE_COLORS.length
                                        ]
                                      }
                                    />
                                  ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-apple-steel">
                            No site breakdown found.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-apple-mist bg-white">
                      <div className="border-b border-apple-mist px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                          Payroll Distribution Per Site
                        </p>
                      </div>
                      <div className="flex flex-1 px-4 py-4">
                        {siteDistribution.length > 0 ? (
                          <div className="grid h-full min-h-[320px] w-full grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                            <div className="h-[220px] min-h-0 sm:h-[240px] lg:h-full lg:min-h-[320px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={siteDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={58}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    stroke="none"
                                  >
                                    {siteDistribution.map((entry) => (
                                      <Cell
                                        key={entry.name}
                                        fill={entry.color}
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={(props) => (
                                      <PayrollReportAnalyticsTooltip
                                        {...props}
                                        valueFormatter={(value) =>
                                          formatPayrollReportPeso(value)
                                        }
                                      />
                                    )}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="min-h-0 pr-1 lg:pr-2">
                              {siteDistribution.map((entry, index) => (
                                <div
                                  key={`${entry.name}-${index}`}
                                  className="flex items-start gap-2 py-1"
                                >
                                  <span
                                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-2xs font-medium text-apple-smoke">
                                      {entry.name}
                                    </p>
                                    <p className="truncate text-sm font-medium text-apple-charcoal">
                                      {formatPayrollReportPeso(entry.value)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-[260px] items-center justify-center text-sm text-apple-steel">
                            No site distribution data found.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_12px_28px_rgba(17,46,26,0.08)]">
                  <div className="border-b border-apple-mist px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                          Employee Payrolls
                        </p>
                        <p className="mt-1 text-xs text-apple-steel">
                          Complete employees and payroll values inside this
                          submitted report.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold text-apple-steel">
                          {filteredPayrollItems.length.toLocaleString("en-PH")}{" "}
                          of {payrollItems.length.toLocaleString("en-PH")}{" "}
                          employees
                        </p>
                        <p className="mt-1 text-sm font-semibold text-apple-charcoal">
                          Total Payroll Generated:{" "}
                          {formatPayrollReportPeso(filteredPayrollTotal)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className="relative min-w-[220px]">
                        <Search
                          size={14}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-apple-smoke"
                        />
                        <input
                          type="search"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search employee..."
                          className="h-9 w-full rounded-lg border border-apple-mist bg-white pl-9 pr-3 text-xs text-apple-charcoal outline-none transition focus:border-[#1f6a37]"
                        />
                      </div>
                      <select
                        value={siteFilter}
                        onChange={(event) => setSiteFilter(event.target.value)}
                        className="h-9 min-w-[180px] rounded-lg border border-apple-mist bg-white px-3 text-xs text-apple-charcoal outline-none transition focus:border-[#1f6a37]"
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
                  <div className="max-h-[440px] overflow-auto">
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
                          filteredPayrollItems.map((item) => (
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
                                  className="rounded-lg border border-[#1f6a37] bg-[#1f6a37] px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-white transition hover:bg-[#18532b]"
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

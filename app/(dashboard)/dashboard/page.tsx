"use client";

import { useMemo } from "react";
import {
  ArrowUp,
  BadgeCheck,
  Check,
  Ellipsis,
  Receipt,
  RefreshCcw,
  Upload,
  Wallet,
} from "lucide-react";
import {
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
import ChartTooltip from "@/components/charts/ChartTooltip";
import { useAppState } from "@/features/app/AppStateProvider";
import { selectWorkforceByBranch } from "@/features/analytics/utils/analyticsSelectors";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";
import { buildPayrollInsightsData } from "@/lib/payrollInsights";

const OVERVIEW_CHART_COLORS = [
  "rgb(var(--theme-chart-1))",
  "rgb(var(--theme-chart-2))",
  "rgb(var(--theme-chart-3))",
  "rgb(var(--theme-chart-4))",
  "rgb(var(--theme-chart-5))",
];
const PESO_SIGN = "\u20B1";

function extractBranchName(value: string): string {
  if (!value) return "";
  return value.trim().split(/\s+/)[0].toUpperCase();
}

export default function OverviewPage() {
  const { payroll, attendancePeriod, records, employees, attendance } =
    useAppState();

  const payrollInsights = useMemo(
    () =>
      buildPayrollInsightsData(
        payroll.payrollRows,
        payroll.payrollAttendanceInputs,
      ),
    [payroll.payrollAttendanceInputs, payroll.payrollRows],
  );

  const totalPayroll = payrollInsights.kpis.totalPayroll;
  const grossPayroll = Math.round(totalPayroll * 1.12 * 100) / 100;
  const deductions =
    Math.round(Math.max(0, grossPayroll - totalPayroll) * 100) / 100;
  const netPayroll = Math.max(0, totalPayroll);

  const activityRows = payroll.payrollRows.slice(0, 5).map((row) => ({
    type: row.overtimeHours > 0 ? "Overtime" : "Payroll Run",
    employee: row.worker,
    amount: `${PESO_SIGN} ${formatPayrollNumber(row.totalPay)}`,
    status: payroll.payrollGenerated ? "Success" : "Ready",
    method: row.site.split(" ")[0] || "Attendance Import",
  }));

  const workforceByBranch = useMemo(
    () =>
      selectWorkforceByBranch(records).map((item, index) => ({
        ...item,
        shortBranch: extractBranchName(item.branch),
        fill: OVERVIEW_CHART_COLORS[index % OVERVIEW_CHART_COLORS.length],
      })),
    [records],
  );

  const payrollDistributionData = useMemo(
    () =>
      payrollInsights.payrollDistributionByProject.map((item, index) => ({
        ...item,
        shortName: extractBranchName(item.name),
        fill: OVERVIEW_CHART_COLORS[index % OVERVIEW_CHART_COLORS.length],
      })),
    [payrollInsights.payrollDistributionByProject],
  );

  const siteCards = useMemo(() => {
    return attendance.availableSites.map((siteName) => {
      const shortSite = extractBranchName(siteName);
      const workforceMatch = workforceByBranch.find(
        (item) => item.shortBranch === shortSite,
      );
      const payrollMatch = payrollDistributionData.find(
        (item) => item.shortName === shortSite,
      );

      return {
        siteName,
        shortSite,
        employees: workforceMatch?.employees ?? 0,
        payrollTotal: payrollMatch?.value ?? 0,
      };
    });
  }, [attendance.availableSites, payrollDistributionData, workforceByBranch]);

  return (
    <div className="space-y-5">
      <section className="rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-6 text-white shadow-[0_18px_36px_rgba(22,101,52,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium text-white/65">
              Total Payroll This Period
            </p>
            <div className="mt-3 flex items-center gap-3">
              <h1 className="text-[40px] font-semibold tracking-[-0.03em]">
                {PESO_SIGN} {formatPayrollNumber(netPayroll)}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[rgb(var(--theme-chart-5))]">
                Synced <ArrowUp size={12} />
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[rgb(var(--theme-chart-5))] px-4 text-sm font-semibold text-[rgb(var(--apple-black))] transition hover:bg-[rgb(var(--apple-silver))]">
              <span className="text-base leading-none">+</span>
              Process
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/15">
              <Upload size={14} />
              Export
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/15">
              <RefreshCcw size={14} />
              Sync
            </button>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15">
              <Ellipsis size={16} />
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-[12px] bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold text-apple-charcoal">
                Analytics Overview
              </p>
              <p className="mt-1 text-sm text-apple-steel">
                Live charts from attendance and payroll analytics.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-4">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                  Employees per Branch
                </p>
                <p className="mt-1 text-xs text-apple-steel">
                  Attendance Analytics
                </p>
              </div>

              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workforceByBranch}
                    barCategoryGap="28%"
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgb(var(--theme-chart-grid))"
                    />
                    <XAxis
                      dataKey="shortBranch"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
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
                    />
                    <Tooltip
                      cursor={{ fill: "rgb(var(--theme-chart-cursor))" }}
                      content={(props) => (
                        <ChartTooltip {...props} unit="employees" />
                      )}
                    />
                    <Bar dataKey="employees" radius={[6, 6, 6, 6]} barSize={38}>
                      {workforceByBranch.map((entry, index) => (
                        <Cell
                          key={`overview-workforce-${entry.shortBranch}-${index}`}
                          fill={entry.fill}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-4">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                  Payroll Distribution by Project
                </p>
                <p className="mt-1 text-xs text-apple-steel">
                  Payroll Analytics
                </p>
              </div>

              <div className="grid h-[260px] grid-cols-[minmax(0,1fr)_160px] gap-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={payrollDistributionData}
                      dataKey="value"
                      nameKey="shortName"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {payrollDistributionData.map((entry, index) => (
                        <Cell
                          key={`overview-payroll-distribution-${entry.name}-${index}`}
                          fill={entry.fill}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;

                        const item = payload[0]?.payload as
                          | {
                              shortName?: string;
                              name?: string;
                              value?: number;
                            }
                          | undefined;

                        return (
                          <div className="rounded-xl border border-apple-mist bg-white p-3 text-apple-charcoal shadow-xl backdrop-blur-md">
                            <p className="mb-1 text-[10px] uppercase tracking-widest opacity-60">
                              Branch
                            </p>
                            <p className="max-w-[160px] truncate text-xs font-semibold text-apple-smoke">
                              {item?.shortName ?? item?.name ?? "Unknown"}
                            </p>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="text-lg font-bold">
                                {PESO_SIGN}{" "}
                                {formatPayrollNumber(item?.value ?? 0)}
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-3 overflow-y-auto pr-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-apple-silver">
                    Branch
                  </p>
                  {payrollDistributionData.length > 0 ? (
                    payrollDistributionData.map((item, index) => (
                      <div
                        key={`overview-payroll-legend-${item.name}-${index}`}
                        className="flex items-start gap-2"
                      >
                        <span
                          className="mt-1 h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium text-apple-smoke">
                            {item.shortName}
                          </p>
                          <p className="truncate text-xs font-semibold text-apple-charcoal">
                            {PESO_SIGN} {formatPayrollNumber(item.value)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-apple-steel">
                      Upload attendance files to populate payroll distribution.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-[22px] bg-white p-6 shadow-[0_18px_40px_rgba(24,83,43,0.08)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Wallet size={18} />
              </div>
              <p className="text-sm font-medium text-apple-steel">
                Gross Payroll
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-green-600 px-3 py-1 text-xs ">
              Synced <ArrowUp size={12} />
            </span>
          </div>
          <p className="mt-6 text-[32px] font-semibold tracking-[-0.03em] text-apple-charcoal">
            {PESO_SIGN} {formatPayrollNumber(grossPayroll)}
          </p>
          <p className="mt-3 text-sm font-medium text-apple-charcoal">
            Based on uploaded attendance
          </p>
        </div>

        <div className="rounded-[22px]  bg-white p-6 shadow-[0_18px_40px_rgba(24,83,43,0.08)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                <Receipt size={18} />
              </div>
              <p className="text-sm font-medium text-apple-steel">Deductions</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-green-600 px-3 py-1 text-xs ">
              Synced <ArrowUp size={12} />
            </span>
          </div>
          <p className="mt-6 text-[32px] font-semibold tracking-[-0.03em] text-apple-charcoal">
            {PESO_SIGN} {formatPayrollNumber(deductions)}
          </p>
          <p className="mt-3 text-sm font-medium text-apple-ash">
            Derived from current payroll
          </p>
        </div>

        <div className="rounded-[22px]  bg-white p-6 shadow-[0_18px_40px_rgba(24,83,43,0.08)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <BadgeCheck size={18} />
              </div>
              <p className="text-sm font-medium text-apple-steel">
                Net Payroll Released
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-green-600 px-3 py-1 text-xs ">
              Synced <ArrowUp size={12} />
            </span>
          </div>
          <p className="mt-6 text-[32px] font-semibold tracking-[-0.03em] text-apple-charcoal">
            {PESO_SIGN} {formatPayrollNumber(netPayroll)}
          </p>
          <p className="mt-3 text-sm font-medium text-apple-charcoal">
            Synced with payroll analytics
          </p>
        </div>
      </section>

      <section className="rounded-[12px] bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[15px] font-semibold text-apple-charcoal">
            Department Cards
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {siteCards.length > 0 ? (
            siteCards.map((card) => (
              <div
                key={card.siteName}
                className="rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-5 text-white  shadow-[0_18px_36px_rgba(22,101,52,0.16)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{card.shortSite}</p>
                  <span className="text-[11px] text-white/65">SITE</span>
                </div>

                <p className="mt-6 text-[12px] uppercase tracking-[0.28em] text-white/55">
                  Employees
                </p>
                <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em]">
                  {card.employees.toLocaleString("en-PH")}
                </p>

                <p className="mt-6 text-[12px] uppercase tracking-[0.28em] text-white/55">
                  Total Payroll
                </p>
                <p className="mt-2 text-[30px] font-semibold tracking-[-0.03em]">
                  {PESO_SIGN} {formatPayrollNumber(card.payrollTotal)}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-5 text-white shadow-[0_18px_36px_rgba(22,101,52,0.16)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">OPERATIONS</p>
                <span className="text-[11px] text-white/65">DEPT</span>
              </div>
              <p className="mt-8 text-sm text-white/70">
                No sites uploaded yet.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[12px] bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[15px] font-semibold text-apple-charcoal">
            Recent Payroll Activity
          </p>
          <p className="text-xs text-emerald-500">{attendancePeriod}</p>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-apple-mist">
          <div className="grid grid-cols-[1fr_1.2fr_1fr_0.9fr_1fr] bg-[rgb(var(--apple-snow))] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-500">
            <span>Type</span>
            <span>Employee</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Branch</span>
          </div>

          <div className="divide-y divide-apple-mist">
            {activityRows.length > 0 ? (
              activityRows.map((row) => (
                <div
                  key={`${row.type}-${row.employee}`}
                  className="grid grid-cols-[1fr_1.2fr_1fr_0.9fr_1fr] items-center px-4 py-4"
                >
                  <span className="text-sm font-medium text-apple-ash">
                    {row.type}
                  </span>
                  <span className="text-sm font-semibold text-apple-charcoal">
                    {row.employee}
                  </span>
                  <span className="text-sm text-apple-ash">{row.amount}</span>
                  <span
                    className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      row.status === "Success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-[rgb(var(--apple-snow))] text-apple-charcoal"
                    }`}
                  >
                    {row.status === "Success" && <Check size={11} />}
                    {row.status}
                  </span>
                  <span className="text-sm text-apple-smoke">{row.method}</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-apple-steel">
                Upload attendance files to populate dashboard activity.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

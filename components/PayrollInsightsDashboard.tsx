"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  type TooltipProps,
} from "recharts";
import type { AttendanceRecordInput, PayrollRow } from "@/lib/payrollEngine";
import { buildPayrollInsightsData } from "@/lib/payrollInsights";
import {
  aggregateDailyPaidPoints,
  aggregateDailyPointsToCalendarWeeks,
  type DailyPaidPoint,
  type TrendRange,
} from "@/lib/payrollTrend";

interface PayrollInsightsDashboardProps {
  payrollRows: PayrollRow[];
  attendanceRows: AttendanceRecordInput[];
  dailyPaidPoints?: DailyPaidPoint[];
}

const THEME_BRANCH_COLORS = [
  "rgb(var(--theme-chart-1))",
  "rgb(var(--theme-chart-2))",
  "rgb(var(--theme-chart-3))",
  "rgb(var(--theme-chart-4))",
  "rgb(var(--theme-chart-5))",
  "rgb(var(--theme-chart-2))",
  "rgb(var(--theme-chart-3))",
  "rgb(var(--theme-chart-4))",
  "rgb(var(--theme-chart-5))",
  "rgb(var(--theme-chart-1))",
];

const PIE_CHART_COLORS = [
  "rgb(var(--theme-chart-1))",
  "rgb(var(--theme-chart-2))",
  "rgb(var(--theme-chart-3))",
  "rgb(var(--theme-chart-4))",
  "rgb(var(--theme-chart-5))",
  "rgba(24, 83, 43, 0.75)",
  "rgba(37, 113, 58, 0.75)",
  "rgba(57, 145, 80, 0.72)",
  "rgba(92, 179, 116, 0.72)",
  "rgba(147, 212, 163, 0.88)",
];

const STACK_COLORS = {
  regular: "rgb(var(--theme-chart-2))",
  overtime: "rgb(var(--theme-chart-3))",
  allowance: "rgb(var(--theme-chart-5))",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactCurrency(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-PH");
}

function shorten(value: string, max = 16): string {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function extractBranchName(value: string): string {
  if (!value) return "";
  return value.trim().split(/\s+/)[0].toUpperCase();
}

function getBranchColor(index: number) {
  return THEME_BRANCH_COLORS[index % THEME_BRANCH_COLORS.length];
}

function getPieColor(index: number) {
  return PIE_CHART_COLORS[index % PIE_CHART_COLORS.length];
}

type CustomChartTooltipProps = TooltipProps<number, string> & {
  valueFormatter?: (value: number) => string;
  unit?: string;
};

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  unit,
}: CustomChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-2xl border border-apple-mist bg-white px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      {label ? (
        <p className="mb-2 text-[14px] font-semibold text-apple-charcoal">
          {String(label)}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const rawValue =
            typeof entry.value === "number"
              ? entry.value
              : Number(entry.value ?? 0);

          return (
            <div
              key={`${String(entry.dataKey)}-${index}`}
              className="flex items-center gap-2"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: entry.color || "rgb(var(--theme-chart-2))",
                }}
              />
              <span className="text-[12px] text-apple-smoke">
                {String(entry.name || entry.dataKey || "")}
              </span>
              <span className="ml-auto text-[12px] font-semibold text-apple-charcoal">
                {valueFormatter ? valueFormatter(rawValue) : rawValue}
                {unit ? ` ${unit}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  actions,
  height = "h-[320px]",
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  height?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
          {title}
        </h3>
        {actions}
      </div>

      <div
        className={`${height} w-full rounded-2xl border border-apple-mist bg-white p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]`}
      >
        {children}
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl shadow-apple-xs border bg-apple-snow  border-apple-mist p-4 sm:p-5   shadow-[0_8px_18px_rgba(24,83,43,0.06)] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] ">
      <p className="text-[11px] text-white/65 font-semibold uppercase tracking-wider ">
        {label}
      </p>
      <p className="mt-2 text-lg text-white font-bold tracking-tight  sm:text-xl">
        {value}
      </p>
    </div>
  );
}

export default function PayrollInsightsDashboard({
  payrollRows,
  attendanceRows,
  dailyPaidPoints = [],
}: PayrollInsightsDashboardProps) {
  const [trendRange, setTrendRange] = useState<TrendRange>("daily");
  const insights = useMemo(
    () => buildPayrollInsightsData(payrollRows, attendanceRows),
    [payrollRows, attendanceRows],
  );
  const dailyPaidTrend = useMemo<DailyPaidPoint[]>(
    () => {
      if (dailyPaidPoints.length > 0) {
        return [...dailyPaidPoints].sort((a, b) => a.date.localeCompare(b.date));
      }

      return insights.payrollCostTrend
        .map((point) => ({
          date: point.period,
          total: point.total,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    [dailyPaidPoints, insights.payrollCostTrend],
  );
  const payrollPaidTrend = useMemo(() => {
    if (trendRange === "weekly") {
      return aggregateDailyPointsToCalendarWeeks(dailyPaidTrend);
    }

    return aggregateDailyPaidPoints(dailyPaidTrend, trendRange);
  }, [dailyPaidTrend, trendRange]);

  const projectDistributionData = useMemo(() => {
    return insights.payrollDistributionByProject.map((item, index) => ({
      ...item,
      shortName: extractBranchName(item.name),
      fill: getPieColor(index),
    }));
  }, [insights.payrollDistributionByProject]);

  const topPaidEmployeesData = useMemo(() => {
    return insights.topPaidEmployees.map((item, index) => ({
      ...item,
      employeeName: shorten(item.employeeName, 20),
      fill: getBranchColor(index),
    }));
  }, [insights.topPaidEmployees]);

  const payrollCostPerProjectData = useMemo(() => {
    return insights.payrollCostPerProject.map((item, index) => ({
      ...item,
      shortProject: extractBranchName(item.project),
      fill: getBranchColor(index),
    }));
  }, [insights.payrollCostPerProject]);

  if (payrollRows.length === 0) return null;

  return (
    <section
      className="animate-fade-up"
      style={{ animationFillMode: "both", animationDelay: "40ms" }}
    >
      <div className="overflow-hidden rounded-3xl border border-apple-mist bg-white shadow-sm">
        <div className="border-b border-apple-mist px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-apple-steel">
              Data Analytics
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-apple-charcoal sm:text-2xl">
            Payroll Insights Dashboard
          </h2>

          <p className="mt-1 text-sm text-apple-steel">
            Financial analytics and workforce payroll overview for the selected
            pay period.
          </p>
        </div>

        <div className="space-y-10 px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total Payroll"
              value={formatCurrency(insights.kpis.totalPayroll)}
            />
            <KpiCard
              label="Employees Paid"
              value={insights.kpis.employeesPaid}
            />
            <KpiCard
              label="Total Overtime Cost"
              value={formatCurrency(insights.kpis.totalOvertimeCost)}
            />
            <KpiCard
              label="Average Salary"
              value={formatCurrency(insights.kpis.averageSalary)}
            />
          </div>

          <ChartCard
            title="Payroll Paid Trend"
            height="h-[360px]"
            actions={
              <div className="inline-flex rounded-xl border border-apple-mist bg-[rgb(var(--apple-snow))] p-1">
                {(["daily", "weekly", "monthly", "yearly"] as TrendRange[]).map(
                  (option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTrendRange(option)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                        trendRange === option
                          ? "bg-[#1f6a37] text-white"
                          : "text-apple-steel hover:text-apple-charcoal"
                      }`}
                    >
                      {option}
                    </button>
                  ),
                )}
              </div>
            }
          >
            {payrollPaidTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-apple-steel">No trend data available.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={payrollPaidTrend}
                  margin={{ top: 10, right: 12, left: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="analyticsTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgb(var(--theme-chart-grid))"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
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
                    tickFormatter={(value) => formatCompactCurrency(Number(value))}
                  />
                  <Tooltip
                    content={<ChartTooltip valueFormatter={formatCurrency} />}
                    cursor={{ fill: "rgb(var(--theme-chart-cursor))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Paid Total"
                    stroke="rgb(var(--theme-chart-3))"
                    strokeWidth={3}
                    fill="url(#analyticsTrendFill)"
                    dot={{ r: 0 }}
                    activeDot={{
                      r: 5,
                      fill: "rgb(var(--theme-chart-3))",
                      stroke: "white",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <ChartCard
              title="Payroll Distribution by Project"
              height="min-h-[350px]"
            >
              {projectDistributionData.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-apple-steel">
                    No project distribution data.
                  </p>
                </div>
              ) : (
                <div className="grid h-full min-h-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="h-[220px] min-h-0 sm:h-[240px] lg:h-full lg:min-h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectDistributionData}
                          dataKey="value"
                          nameKey="shortName"
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={90}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {projectDistributionData.map((entry, index) => (
                            <Cell
                              key={`${entry.name}-${index}`}
                              fill={entry.fill}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={
                            <ChartTooltip valueFormatter={formatCurrency} />
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="min-h-0 pr-1 lg:pr-2">
                    {projectDistributionData.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex items-start gap-2 py-1"
                      >
                        <span
                          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-2xs font-medium text-apple-smoke">
                            {item.shortName}
                          </p>
                          <p className="truncate text-sm font-medium text-apple-charcoal">
                            {formatCurrency(item.value)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ChartCard>

            <ChartCard title="Top 10 Highest Paid Employees" height="h-[550px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topPaidEmployeesData}
                  layout="vertical"
                  barCategoryGap={18}
                  barGap={4}
                  margin={{ top: 10, right: 20, left: 92, bottom: 10 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="employeeName"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={140}
                    tick={{
                      fill: "rgb(var(--theme-chart-axis))",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgb(var(--theme-chart-grid))" }}
                    content={<ChartTooltip valueFormatter={formatCurrency} />}
                  />
                  <Bar
                    dataKey="salary"
                    name="Salary"
                    radius={[6, 6, 6, 6]}
                    barSize={34}
                  >
                    {topPaidEmployeesData.map((entry, index) => (
                      <Cell
                        key={`top-paid-cell-${entry.employeeName}-${index}`}
                        fill={entry.fill}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="lg:col-span-2">
              <ChartCard
                title="Payroll Cost per Project"
                height="h-[380px]"
                actions={
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: "rgb(var(--theme-chart-2))" }}
                      />
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: "rgb(var(--theme-chart-2))" }}
                      >
                        Regular
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: "rgb(var(--theme-chart-3))" }}
                      />
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: "rgb(var(--theme-chart-3))" }}
                      >
                        Overtime
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: "rgb(var(--theme-chart-5))" }}
                      />
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: "rgb(var(--theme-chart-4))" }}
                      >
                        Allowance
                      </span>
                    </div>
                  </div>
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={payrollCostPerProjectData}
                    barCategoryGap="30%"
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgb(var(--theme-chart-grid))"
                    />
                    <XAxis
                      dataKey="shortProject"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={{
                        fill: "rgb(var(--theme-chart-axis))",
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "rgb(var(--theme-chart-axis))",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgb(var(--theme-chart-cursor))" }}
                      content={<ChartTooltip valueFormatter={formatCurrency} />}
                    />
                    <Bar
                      dataKey="regularPay"
                      name="Regular Pay"
                      stackId="payrollCost"
                      radius={[6, 6, 6, 6]}
                      barSize={46}
                    >
                      {payrollCostPerProjectData.map((entry, index) => (
                        <Cell
                          key={`regular-cell-${entry.shortProject}-${index}`}
                          fill={entry.fill}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="overtimePay"
                      name="Overtime Pay"
                      stackId="payrollCost"
                      fill={STACK_COLORS.overtime}
                    />
                    <Bar
                      dataKey="allowance"
                      name="Allowance"
                      stackId="payrollCost"
                      fill={STACK_COLORS.allowance}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

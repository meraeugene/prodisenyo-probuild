"use client";

import { ChartTooltip, ChartCard, KpiCard } from "@/features/analytics/components/PayrollInsightsUi";
import { STACK_COLORS, formatCurrency, formatCompactCurrency, extractBranchName, shorten, getBranchColor, getPieColor } from "@/features/analytics/utils/payrollInsightPresentation";


import { useMemo, useState } from "react";

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
      <div className="overflow-hidden rounded-2xl border border-transparent bg-white shadow-workspace">
        <div className="border-b border-apple-mist px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-apple-steel">
              Data Analytics
            </span>
          </div>

          <h2 className="text-lg font-semibold tracking-tight text-apple-charcoal">
            Payroll insights
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
                          ? "bg-[#076d69] text-white"
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
                      <stop offset="5%" stopColor="#076d69" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#076d69" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="0"
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
                    stroke="rgb(var(--theme-chart-1))"
                    strokeWidth={3}
                    fill="url(#analyticsTrendFill)"
                    dot={{ r: 0 }}
                    activeDot={{
                      r: 5,
                      fill: "rgb(var(--theme-chart-1))",
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

            <ChartCard title="Top 10 Highest Paid Employees" chartHeight={Math.max(320, topPaidEmployeesData.length * 46 + 20)}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topPaidEmployeesData}
                  layout="vertical"
                  barCategoryGap={18}
                  barGap={4}
                  margin={{ top: 10, right: 16, left: 0, bottom: 10 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="employeeName"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={126}
                    tick={{
                      fill: "rgb(var(--theme-chart-axis))",
                      fontSize: 11,
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
                      strokeDasharray="0"
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

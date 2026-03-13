"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AttendanceRecordInput, PayrollRow } from "@/lib/payrollEngine";
import { buildPayrollInsights } from "@/lib/payrollInsights";

interface PayrollInsightsProps {
  payrollRows: PayrollRow[];
  attendanceRows: AttendanceRecordInput[];
}

const PIE_COLORS = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
  "#F97316",
  "#84CC16",
];

const CHART_COLORS = {
  regular: "#2563EB",
  overtime: "#F59E0B",
  total: "#10B981",
  salary: "#1D4ED8",
  allowance: "#A78BFA",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function truncateLabel(value: string, max = 14): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h4 className="text-sm font-semibold text-apple-charcoal mb-4">{title}</h4>
      {children}
    </div>
  );
}

export default function PayrollInsights({
  payrollRows,
  attendanceRows,
}: PayrollInsightsProps) {
  const insights = useMemo(
    () => buildPayrollInsights(payrollRows, attendanceRows),
    [payrollRows, attendanceRows],
  );

  const hasAnyData = payrollRows.length > 0;

  if (!hasAnyData) {
    return (
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-bold text-apple-charcoal">Payroll Insights</h3>
        <p className="text-sm text-apple-smoke mt-1">
          Financial analytics and workforce payroll overview for the selected pay
          period.
        </p>
        <p className="text-sm text-apple-smoke mt-4">
          No payroll data available for insights yet.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-apple-charcoal tracking-tight">
          Payroll Insights
        </h3>
        <p className="text-sm text-apple-smoke mt-1">
          Financial analytics and workforce payroll overview for the selected pay
          period.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-apple-steel uppercase tracking-wider">
            Total Payroll
          </p>
          <p className="mt-2 text-lg sm:text-xl font-bold text-apple-charcoal">
            {formatCurrency(insights.kpis.totalPayroll)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-apple-steel uppercase tracking-wider">
            Employees Paid
          </p>
          <p className="mt-2 text-lg sm:text-xl font-bold text-apple-charcoal">
            {insights.kpis.employeesPaid}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-apple-steel uppercase tracking-wider">
            Total Overtime Cost
          </p>
          <p className="mt-2 text-lg sm:text-xl font-bold text-apple-charcoal">
            {formatCurrency(insights.kpis.totalOvertimeCost)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-apple-steel uppercase tracking-wider">
            Average Salary
          </p>
          <p className="mt-2 text-lg sm:text-xl font-bold text-apple-charcoal">
            {formatCurrency(insights.kpis.averageSalary)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ChartCard title="Payroll Cost Trend">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={insights.payrollCostTrend}
                margin={{ top: 8, right: 8, left: 0, bottom: 20 }}
              >
                <XAxis
                  dataKey="period"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend
                  wrapperStyle={{
                    fontSize: "11px",
                    paddingTop: "10px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="regular"
                  stroke={CHART_COLORS.regular}
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="overtime"
                  stroke={CHART_COLORS.overtime}
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={CHART_COLORS.total}
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Payroll Distribution by Project">
          <div className="h-[300px] space-y-3">
            {insights.payrollDistributionByProject.length === 0 ? (
              <p className="text-sm text-apple-smoke">No project data yet.</p>
            ) : (
              <>
                <div className="h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={insights.payrollDistributionByProject}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={78}
                        paddingAngle={2}
                        isAnimationActive={false}
                      >
                        {insights.payrollDistributionByProject.map((entry, index) => (
                          <Cell
                            key={`${entry.name}-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="max-h-[95px] overflow-y-auto pr-1 space-y-1">
                  {insights.payrollDistributionByProject.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                          }}
                        />
                        <span className="text-apple-ash truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-apple-steel font-medium">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Overtime Cost by Employee">
          <div className="h-[260px]">
            {insights.overtimeCostByEmployee.length === 0 ? (
              <p className="text-sm text-apple-smoke">No overtime cost data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={insights.overtimeCostByEmployee}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 18, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="employeeName"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={90}
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    tickFormatter={(value) => truncateLabel(String(value), 12)}
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar
                    dataKey="overtimePay"
                    fill={CHART_COLORS.overtime}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Top 10 Highest Paid Employees">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={insights.topPaidEmployees}
                layout="vertical"
                margin={{ left: 18, right: 8 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="employeeName"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={90}
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                  tickFormatter={(value) => truncateLabel(String(value), 12)}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar
                  dataKey="salary"
                  fill={CHART_COLORS.salary}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Payroll Cost per Project">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={insights.payrollCostPerProject}
                layout="vertical"
                margin={{ top: 6, right: 8, left: 24, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                />
                <YAxis
                  dataKey="project"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={95}
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                  tickFormatter={(value) => truncateLabel(String(value), 13)}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend
                  wrapperStyle={{
                    fontSize: "11px",
                    paddingTop: "8px",
                  }}
                />
                <Bar dataKey="regularPay" stackId="cost" fill={CHART_COLORS.regular} />
                <Bar dataKey="overtimePay" stackId="cost" fill={CHART_COLORS.overtime} />
                <Bar dataKey="allowance" stackId="cost" fill={CHART_COLORS.allowance} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </section>
  );
}

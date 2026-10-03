"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPayrollCurrency } from "@/features/payroll-dashboard/utils/payrollDashboard";
import { CHART_TOOLTIP_STYLE } from "@/lib/chartTheme";

const COLORS = ["#076d69", "#69a99b", "#cfab65"];

export default function PayrollBreakdownChart({
  regularPay,
  supplementalPay,
  deductions,
}: {
  regularPay: number;
  supplementalPay: number;
  deductions: number;
}) {
  const data = [
    { name: "Regular pay", value: regularPay, color: COLORS[0] },
    { name: "Overtime & holiday", value: supplementalPay, color: COLORS[1] },
    { name: "Deductions", value: deductions, color: COLORS[2] },
  ].filter((item) => item.value > 0);

  if (!data.length) return null;

  return (
    <div className="h-44 w-full" aria-label="Approved payroll composition chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={46}
            outerRadius={68}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatPayrollCurrency(Number(value))}
            contentStyle={CHART_TOOLTIP_STYLE}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { OperationExpensePeriod } from "../types";
import type { buildOperationExpenseTrend } from "../utils/operationExpenseCharts";
import type { summarizeOperationExpenses } from "../utils/operationExpenseSelectors";
import { formatRentalMoney } from "@/features/gmea-rentals/utils/rentalUi";
import styles from "@/components/workspace/workspace.module.css";

export default function OperationExpenseCharts({ trend, summary, period }: {
  trend: ReturnType<typeof buildOperationExpenseTrend>; summary: ReturnType<typeof summarizeOperationExpenses>; period: OperationExpensePeriod;
}) {
  return <section aria-label="Operation expense charts" className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
    <figure className={`${styles.panel} min-w-0 p-4`}>
      <figcaption className="font-semibold text-slate-900">{period === "all" ? "All expenses by month" : period === "month" ? "Monthly expenses by week" : "Weekly expenses by day"}</figcaption>
      <div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} height={50} tickFormatter={value => period === "month" ? String(value).replace(/[A-Za-z]+ /g, "") : value} />
        <YAxis width={60} tick={{ fontSize: 11 }} tickFormatter={value => new Intl.NumberFormat("en-PH", { notation: "compact" }).format(value)} />
        <Tooltip formatter={value => formatRentalMoney(Number(value))} /><Bar dataKey="amount" name="Expenses" fill="#076d69" radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart></ResponsiveContainer></div>
      <details className="mt-3"><summary className="cursor-pointer text-sm text-teal-700">View trend data</summary>
        <table className="mt-3 w-full text-left text-sm"><thead><tr><th scope="col">Period</th><th scope="col">Expenses</th></tr></thead>
          <tbody>{trend.map(row => <tr key={row.start}><th scope="row" className="py-2 font-normal">{row.label}</th><td>{formatRentalMoney(row.amount)}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
    <figure className={`${styles.panel} min-w-0 p-4`}>
      <figcaption className="font-semibold text-slate-900">Expenses by category</figcaption>
      <div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={summary.categories} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={value => new Intl.NumberFormat("en-PH", { notation: "compact" }).format(value)} />
        <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 11 }} /><Tooltip formatter={value => formatRentalMoney(Number(value))} />
        <Bar dataKey="amount" name="Expenses" fill="#d79d44" radius={[0, 3, 3, 0]} isAnimationActive={false} />
      </BarChart></ResponsiveContainer></div>
      <details className="mt-3"><summary className="cursor-pointer text-sm text-teal-700">View category data</summary>
        <table className="mt-3 w-full text-left text-sm"><thead><tr><th scope="col">Category</th><th scope="col">Expenses</th></tr></thead>
          <tbody>{summary.categories.map(row => <tr key={row.category}><th scope="row" className="py-2 font-normal">{row.category}</th><td>{formatRentalMoney(row.amount)}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  </section>;
}

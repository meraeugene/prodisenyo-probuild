"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { buildGmeaDashboardTrend } from "../utils/gmeaDashboardSelectors";
import { formatRentalMoney } from "@/features/gmea-rentals/utils/rentalUi";
import styles from "@/components/workspace/workspace.module.css";

export default function GmeaDashboardCharts({ trend }: { trend: ReturnType<typeof buildGmeaDashboardTrend> }) {
  return <section className={`${styles.panel} p-5`} aria-label="GMEA collection and expense trend">
    <h2 className="text-lg font-semibold">Monthly collections and expenses</h2>
    <p className="mt-1 text-sm text-slate-500">Dated rental and project receipts compared with all three expense areas.</p>
    <div className="mt-4 h-80 min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={65} tickFormatter={value => new Intl.NumberFormat("en-PH", { notation: "compact" }).format(value)} />
      <Tooltip formatter={value => formatRentalMoney(Number(value))} /><Legend />
      <Bar dataKey="collected" name="Collected income" fill="#076d69" radius={[3, 3, 0, 0]} /><Bar dataKey="expenses" name="Expenses" fill="#d79d44" radius={[3, 3, 0, 0]} />
    </BarChart></ResponsiveContainer></div>
    <details className="mt-3"><summary className="cursor-pointer text-sm text-teal-700">View chart data</summary><div className="mt-2 overflow-x-auto"><table className={styles.table}>
      <thead><tr><th scope="col">Month</th><th scope="col">Collected income</th><th scope="col">Expenses</th><th scope="col">Net</th></tr></thead>
      <tbody>{trend.map(row => <tr key={row.key}><th scope="row">{row.label}</th>{[row.collected, row.expenses, row.net].map((amount, index) => <td key={index} className="whitespace-nowrap">{formatRentalMoney(amount)}</td>)}</tr>)}</tbody>
    </table></div></details>
  </section>;
}

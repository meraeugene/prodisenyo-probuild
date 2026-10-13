import { formatRentalMoney } from "@/features/gmea-rentals/utils/rentalUi";
import type { buildGmeaDashboardSummary } from "../utils/gmeaDashboardSelectors";
import Link from "next/link";
import styles from "@/components/workspace/workspace.module.css";

export default function GmeaDashboardBreakdown({ summary }: { summary: ReturnType<typeof buildGmeaDashboardSummary> }) {
  const rows = [
    { name: "Rentals", href: "/gmea-rentals/income", income: summary.rentalCollected, expenses: summary.rentalExpenses },
    { name: "Projects", href: "/gmea-projects", income: summary.projectCollected, expenses: summary.projectExpenses },
    { name: "Operation Expenses", href: "/gmea-operation-expenses", income: 0, expenses: summary.operationExpenses },
  ];
  return <section className={styles.panel} aria-label="GMEA income and expense breakdown">
    <h2 className="px-5 py-4 text-lg font-semibold">Income and expenses by area</h2>
    <div className="overflow-x-auto"><table className={styles.table}>
      <thead><tr>{["Area", "Collected income", "Expenses", "Net after expenses"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.name}><th scope="row"><Link className={styles.recordLink} href={row.href}>{row.name}</Link></th>
        {[row.income, row.expenses, row.income - row.expenses].map((value, index) => <td key={index} className="whitespace-nowrap tabular-nums">{formatRentalMoney(value)}</td>)}</tr>)}</tbody>
      <tfoot><tr><th scope="row">Overall</th>{[summary.collected, summary.expenses, summary.net].map((value, index) => <td key={index} className="whitespace-nowrap font-semibold tabular-nums">{formatRentalMoney(value)}</td>)}</tr></tfoot>
    </table></div>
  </section>;
}

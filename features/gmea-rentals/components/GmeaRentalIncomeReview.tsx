import type { HistoricalIncomeRecord } from "../incomeTypes";
import { rentalPaymentTypeLabels } from "../utils/rentalIncomeSelectors";
import { formatRentalDate, formatRentalMoney } from "../utils/rentalUi";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import styles from "@/components/workspace/workspace.module.css";

export default function GmeaRentalIncomeReview({records,filterKey}: {records:HistoricalIncomeRecord[];filterKey:string}) {
  const pagination = useTablePagination(records,filterKey);
  return <div className="space-y-3">
    <p className="text-sm text-slate-600">Review entries across all months. Held payments are excluded from collections. Unconfirmed charges are excluded from outstanding balances. Source values are preserved below.</p>
    {pagination.pageRows.map(record => <article key={record.id} className="space-y-3 rounded-lg border border-amber-200 p-4">
      <header><h3 className="font-semibold">{record.client} · {record.location || "Location not recorded"}</h3><p className="text-xs text-slate-500">{record.source}</p></header>
      <ul className="list-disc pl-5 text-sm text-amber-900">{record.issues.map(issue=><li key={issue}>{issue}</li>)}</ul>
      {record.receipts.filter(receipt=>!receipt.confirmed).map(receipt=><p key={receipt.id} className="text-sm">
        Held: {rentalPaymentTypeLabels[receipt.type]} · {formatRentalMoney(receipt.amount)} · {receipt.date ? formatRentalDate(receipt.date) : "Payment date unconfirmed"} · Source {receipt.source}
      </p>)}
      <details><summary className="cursor-pointer text-sm font-medium">Original Excel rows</summary><div className="mt-2 overflow-x-auto"><table className={styles.table}>
        <thead><tr>{["Row", "Payment label / Date", "Company / Client", "Location", Number(record.sourceRows[0].row)>=93 ? "Down Payment" : "Amount", "Full Payment date",
          Number(record.sourceRows[0].row)>=93 ? "Full Payment" : "Source total / Note", "Source total", "Method"].map((label,index)=><th key={index} scope="col">{label}</th>)}</tr></thead>
        <tbody>{record.sourceRows.map(row=><tr key={row.row}>{["row","E","F","G","H","I","J","K","L"].map(col=><td key={col}>{row[col] ?? "—"}</td>)}</tr>)}</tbody>
      </table></div></details>
    </article>)}
    {!records.length && <p role="status" className={styles.empty}>No matching entries need review.</p>}
    <WorkspaceListPagination {...pagination} total={records.length} noun="review records" label="Rental income review" />
  </div>;
}

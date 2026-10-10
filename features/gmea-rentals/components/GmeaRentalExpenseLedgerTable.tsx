import type { RentalExpense } from "../types";
import { formatRentalDate, formatRentalMoney } from "../utils/rentalUi";
import { rentalVatBreakdown } from "../utils/expenseCalculations";
import styles from "@/components/workspace/workspace.module.css";
import layout from "./rentalExpenseLedger.module.css";

export default function GmeaRentalExpenseLedgerTable({ expenses, categories, equipment, onDetails, canEdit }: { expenses: RentalExpense[]; categories: Map<string, string>; equipment: Map<string, string>; onDetails: (expense: RentalExpense) => void; canEdit: boolean }) {
  return <>
    <div className={layout.desktop}><table data-row-hover="none" className={`${styles.table} ${layout.table}`} style={{ minWidth: 0, tableLayout: "fixed" }}>
      <colgroup>{[13, 28, 20, 14, 14, 11].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
      <thead><tr>{["Date", "Description / Category", "Equipment", "Amount", "Refunded", "Actions"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{expenses.map(expense => <tr key={expense.id}><td>{formatRentalDate(expense.date)}</td><th scope="row" className="font-normal"><p className="font-medium">{expense.description}</p><p className="mt-1 text-xs text-slate-500">{categories.get(expense.category_id)}{expense.supplier ? ` · ${expense.supplier}` : ""}</p></th><td>{expense.equipment_id ? equipment.get(expense.equipment_id) || "Equipment" : "General / salaries"}</td><td>{formatRentalMoney(rentalVatBreakdown(expense.amount, expense.vat_mode, expense.vat_rate).gross)}</td><td>{formatRentalMoney(expense.refunded_amount)}</td><td><button type="button" className={styles.recordLink} onClick={() => onDetails(expense)}>{canEdit ? "Edit" : "Details"}</button></td></tr>)}</tbody>
    </table></div>
    <div className={layout.cards}>{expenses.map(expense => <article key={expense.id} className="space-y-2 border-b border-slate-200 py-4"><div className="flex items-start justify-between gap-3"><p className="break-words font-medium">{expense.description}</p><button type="button" className={`${styles.recordLink} shrink-0`} onClick={() => onDetails(expense)}>{canEdit ? "Edit" : "Details"}</button></div><p className="text-xs text-slate-500">{formatRentalDate(expense.date)} · {categories.get(expense.category_id)}</p><p className="text-sm text-slate-600">{expense.equipment_id ? equipment.get(expense.equipment_id) : "General / salaries"}</p><p className="font-semibold tabular-nums">{formatRentalMoney(rentalVatBreakdown(expense.amount, expense.vat_mode, expense.vat_rate).gross)}</p>{expense.refunded_amount > 0 && <p className="text-xs text-slate-500">Refunded: {formatRentalMoney(expense.refunded_amount)}</p>}</article>)}</div>
    {!expenses.length && <p role="status" className={styles.empty}>No expenses match this period and filters.</p>}
  </>;
}

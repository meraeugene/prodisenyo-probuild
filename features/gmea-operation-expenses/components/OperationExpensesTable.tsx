import type { OperationExpense } from "../types";
import { formatRentalDate, formatRentalMoney } from "@/features/gmea-rentals/utils/rentalUi";
import styles from "@/components/workspace/workspace.module.css";

export default function OperationExpensesTable({ expenses, canEdit, onOpen, onDelete }: {
  expenses: OperationExpense[]; canEdit: boolean; onOpen: (expense: OperationExpense) => void; onDelete: (expense: OperationExpense) => void;
}) {
  return <div className="overflow-x-auto"><table className={styles.table}>
    <caption className="sr-only">Operation expenses in the selected reporting period</caption>
    <thead><tr>{["Date", "Category", "Description", "Payee / Supplier", "Amount", "Mode of payment", "Reference", "Actions"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
    <tbody>{expenses.map(expense => <tr key={expense.id}><td className="whitespace-nowrap">{formatRentalDate(expense.date)}</td><td>{expense.category}</td>
      <th scope="row" className="font-normal">{expense.description}</th><td>{expense.payee || "—"}</td><td className="whitespace-nowrap tabular-nums">{formatRentalMoney(expense.amount)}</td>
      <td>{expense.method || "—"}</td><td>{expense.reference || "—"}</td><td><div className="flex gap-3"><button type="button" className={styles.recordLink} onClick={() => onOpen(expense)}>{canEdit ? "Edit" : "Details"}</button>{canEdit && <button type="button" className="font-medium text-rose-700 hover:underline" onClick={() => onDelete(expense)}>Delete</button>}</div></td></tr>)}</tbody>
  </table>{!expenses.length && <p role="status" className={styles.empty}>No operation expenses match this period and filters.</p>}</div>;
}

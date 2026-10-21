import type { RentalTransaction } from "../transactionTypes";
import type { RentalIncomeRecord } from "../incomeTypes";
import type { RentalExpense } from "../types";
import { rentalPaymentTypeLabels } from "../utils/rentalIncomeSelectors";
import { rentalVatBreakdown } from "../utils/expenseCalculations";
import { formatRentalDate, formatRentalMoney } from "../utils/rentalUi";
import GmeaRentalExpenseTransactionsTable from "./GmeaRentalExpenseTransactionsTable";
import styles from "@/components/workspace/workspace.module.css";
import tableStyles from "./rentalTransactionsTable.module.css";
import RentalRecordRowActions from "./RentalRecordRowActions";

export default function GmeaRentalTransactionsTable({ rows, expenseOnly, onHistory, onExpense, onLocation, canEdit = false, onEditIncome, onDeleteIncome, onDeleteExpense }: {
  rows: RentalTransaction[]; expenseOnly: boolean; onHistory: (record: RentalIncomeRecord) => void;
  onExpense: (expense: RentalExpense) => void; onLocation?: (record: RentalIncomeRecord) => void;
  canEdit?: boolean; onEditIncome?: (record: RentalIncomeRecord) => void; onDeleteIncome?: (record: RentalIncomeRecord) => void; onDeleteExpense?: (expense: RentalExpense) => void;
}) {
  if (expenseOnly) return <GmeaRentalExpenseTransactionsTable expenses={rows.flatMap(row => row.type === "expense" ? [row.expense] : [])} onExpense={onExpense} canEdit={canEdit} onDelete={onDeleteExpense} />;
  return <div><table className={`${styles.table} ${tableStyles.table}`} style={{ minWidth: 0 }}>
    <caption className="sr-only">Rental income and expense records</caption>
    <thead><tr>{["Company / Location", "Type", "Date", "Amount", "Payment method", "Actions"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
    <tbody>{rows.map(row => {
      const rental = row.rental;
      const payment = row.type === "income" ? row.payment : null;
      const amount = row.type === "expense" ? rentalVatBreakdown(row.expense.amount, row.expense.vat_mode, row.expense.vat_rate).gross - row.expense.refunded_amount : payment?.amount;
      return <tr key={row.id}>
        <th scope="row">{row.type === "expense" ? <button type="button" className={`${styles.recordLink} text-left`} onClick={() => onExpense(row.expense)}>{rental?.client || row.expense.description}</button>
          : <button type="button" className={`${styles.recordLink} text-left`} aria-label={`Payment history for ${row.rental.client}`} onClick={() => onHistory(row.rental)}>{row.rental.client}</button>}
          {row.type === "expense" && rental && <p className="mt-1 text-xs font-normal text-slate-600">{row.expense.description}</p>}
          <p className="mt-1 text-xs font-normal text-slate-500">{rental && onLocation ? <button type="button" className="text-left text-teal-700 hover:underline" onClick={() => onLocation(rental)}>{rental.location || "Not recorded"}</button> : rental?.location || "General rental expense"}</p>
        </th>
        <td data-label="Type"><span className={row.type === "income" ? "font-medium text-teal-700" : "font-medium text-amber-700"}>{row.type === "income" ? "Income" : "Expense"}</span>
          {row.type === "income" && <p className="mt-1 text-xs text-slate-500">{payment ? rentalPaymentTypeLabels[payment.payment_type || "unclassified"] : "No confirmed receipt"}</p>}</td>
        <td data-label="Date">{row.date ? formatRentalDate(row.date) : "—"}</td>
        <td data-label="Amount" className={tableStyles.amount}>{amount === undefined ? "—" : formatRentalMoney(amount)}</td>
        <td data-label="Payment method">{row.type === "expense" ? row.expense.method || "Not recorded" : payment?.method || "Not recorded"}</td>
        <td data-label="Actions"><RentalRecordRowActions canEdit={canEdit}
          onEdit={() => row.type === "expense" ? onExpense(row.expense) : onEditIncome?.(row.rental)}
          onDelete={() => row.type === "expense" ? onDeleteExpense?.(row.expense) : onDeleteIncome?.(row.rental)}
          onDetails={() => row.type === "expense" ? onExpense(row.expense) : onHistory(row.rental)} /></td>
      </tr>;
    })}</tbody>
  </table>{!rows.length && <p role="status" className={styles.empty}>{expenseOnly ? "No rental expense records to show." : "No rental records match these filters."}</p>}</div>;
}

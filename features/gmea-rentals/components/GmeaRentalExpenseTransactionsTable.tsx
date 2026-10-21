import type { RentalExpense } from "../types";
import { formatRentalDate, formatRentalMoney } from "../utils/rentalUi";
import { rentalWorkbookExpenseAmount, rentalWorkbookParty } from "../utils/rentalWorkbookTable";
import styles from "@/components/workspace/workspace.module.css";
import tableStyles from "./rentalTransactionsTable.module.css";

export default function GmeaRentalExpenseTransactionsTable({ expenses, onExpense }: {
  expenses: RentalExpense[]; onExpense: (expense: RentalExpense) => void;
}) {
  return <div><table className={`${styles.table} ${tableStyles.table} ${tableStyles.expenseTable}`} style={{ minWidth: 0 }}>
    <caption className="sr-only">Rental expense records</caption>
    <thead><tr>{["Date", "Vehicle / Payee", "Description", "Amount"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
    <tbody>{expenses.map(expense => <tr key={expense.id}>
      <td data-label="Date">{formatRentalDate(expense.date)}</td>
      <th scope="row" data-label="Vehicle / Payee"><button type="button" className={`${styles.recordLink} text-left`} aria-label={`Expense details: ${rentalWorkbookParty(expense)}, ${formatRentalDate(expense.date)}`} onClick={() => onExpense(expense)}>{rentalWorkbookParty(expense)}</button></th>
      <td data-label="Description">{expense.description}</td>
      <td data-label="Amount" className={tableStyles.amount}>{formatRentalMoney(rentalWorkbookExpenseAmount(expense))}</td>
    </tr>)}</tbody>
  </table>{!expenses.length && <p role="status" className={styles.empty}>No rental expense records to show.</p>}</div>;
}

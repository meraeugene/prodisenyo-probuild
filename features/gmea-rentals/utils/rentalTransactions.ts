import type { RentalIncomeRecord } from "../incomeTypes";
import type { RentalExpense } from "../types";
import type { RentalTransaction, RentalTransactionType } from "../transactionTypes";
import { buildRentalIncomeRows, type RentalIncomeTab } from "./rentalWorkbookRecords";
import { rentalClientKey } from "./rentalIncomeSelectors";
import { rentalWeekMetadata } from "./rentalReportingWeeks";

export function buildRentalTransactions(records: RentalIncomeRecord[], expenses: RentalExpense[]): RentalTransaction[] {
  const rentals = new Map(records.map(row => [row.id, row]));
  return [
    ...buildRentalIncomeRows(records).map(row => ({ ...row, type: "income" as const, id: `income:${row.rental.id}:${row.payment?.id || "none"}`, date: row.payment?.payment_date || "" })),
    ...expenses.map(expense => ({ type: "expense" as const, id: `expense:${expense.id}`, date: expense.date, expense,
      rental: rentals.get(expense.rental_id || expense.income_record_id || "") || null })),
  ];
}

export function selectRentalTransactions(rows: RentalTransaction[], type: RentalTransactionType, paymentType: RentalIncomeTab, query: string, client: string, location: string) {
  const search = rentalClientKey(query);
  return rows.filter(row => {
    if (type !== "all" && row.type !== type) return false;
    if (client && rentalClientKey(row.rental?.client || "") !== client || location && rentalClientKey(row.rental?.location || "") !== location) return false;
    if (paymentType !== "all") {
      if (row.type !== "income") return false;
      if (paymentType === "other" ? row.payment && ["down_payment", "full_payment"].includes(row.payment.payment_type || "unclassified") : row.payment?.payment_type !== paymentType) return false;
    }
    const values = [row.rental?.client || "", row.rental?.location || "", row.rental?.rental_number || "",
      ...(row.rental?.items.map(item => item.equipment_name) || [])];
    if (row.type === "income") values.push(row.payment?.method || "");
    else values.push(row.expense.description, row.expense.supplier, row.expense.method, row.expense.invoice_number, rentalWeekMetadata(row.expense.notes)?.party || "");
    return values.some(value => rentalClientKey(value).includes(search));
  }).sort((left, right) => right.date.localeCompare(left.date) || left.id.localeCompare(right.id));
}

export function rentalTransactionOptions(records: RentalIncomeRecord[], key: "client" | "location") {
  return [...new Map(records.filter(row => row[key].trim()).map(row => [rentalClientKey(row[key]), row[key].trim()])).entries()]
    .sort((left, right) => left[1].localeCompare(right[1]));
}

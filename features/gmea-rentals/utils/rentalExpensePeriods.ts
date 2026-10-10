import type { RentalExpense } from "../types";
import { rentalVatBreakdown } from "./expenseCalculations";

export type RentalExpensePeriod = "month" | "week" | "all";
export function rentalExpensePeriodRange(period: RentalExpensePeriod, anchor: string) {
  if (period === "all") return null;
  const date = new Date(`${anchor}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== anchor) return null;
  const start = new Date(date), end = new Date(date);
  if (period === "month") {
    start.setUTCDate(1);
    end.setUTCMonth(end.getUTCMonth() + 1, 0);
  } else {
    start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
    end.setTime(start.getTime()); end.setUTCDate(end.getUTCDate() + 6);
  }
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function latestRentalExpenseDate(expenses: RentalExpense[], today: string) {
  return expenses.reduce((latest, expense) => expense.date > latest ? expense.date : latest, "") || today;
}

export function selectRentalExpenseRows(expenses: RentalExpense[], range: { start: string; end: string } | null, query: string, category: string, equipment: string, equipmentNames: Map<string, string>) {
  const search = query.trim().toLocaleLowerCase();
  return expenses.filter(expense => (!range || expense.date >= range.start && expense.date <= range.end)
    && (!category || expense.category_id === category)
    && (!equipment || (equipment === "general" ? !expense.equipment_id : expense.equipment_id === equipment))
    && [expense.description, expense.supplier, expense.invoice_number, equipmentNames.get(expense.equipment_id || "") || ""].some(value => value.toLocaleLowerCase().includes(search)))
    .sort((left, right) => right.date.localeCompare(left.date) || right.created_at.localeCompare(left.created_at) || left.id.localeCompare(right.id));
}

export function summarizeRentalExpenses(expenses: RentalExpense[]) {
  const totals = expenses.reduce((sum, expense) => {
    const amount = rentalVatBreakdown(expense.amount, expense.vat_mode, expense.vat_rate);
    sum.gross += Math.round(amount.gross * 100); sum.vat += Math.round(amount.vat * 100); sum.refunded += Math.round(expense.refunded_amount * 100);
    return sum;
  }, { gross: 0, vat: 0, refunded: 0 });
  return { gross: totals.gross / 100, vat: totals.vat / 100, refunded: totals.refunded / 100, net: (totals.gross - totals.refunded) / 100 };
}

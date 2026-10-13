import { OPERATION_EXPENSE_CATEGORIES, type OperationExpense } from "../types";
import { rentalExpensePeriodRange } from "@/features/gmea-rentals/utils/rentalExpensePeriods";

export function selectOperationExpenses(rows: OperationExpense[], period: "month" | "week", anchor: string, query: string, category: string) {
  const range = rentalExpensePeriodRange(period, anchor);
  if (!range) return [];
  const search = query.trim().toLowerCase();
  return rows.filter(row => row.date >= range.start && row.date <= range.end && (!category || row.category === category)
    && [row.category, row.description, row.payee, row.reference, row.method].some(value => value.toLowerCase().includes(search)))
    .sort((left, right) => right.date.localeCompare(left.date) || right.created_at.localeCompare(left.created_at) || left.id.localeCompare(right.id));
}
export function summarizeOperationExpenses(rows: OperationExpense[]) {
  const total = (category?: string) => rows.filter(row => !category || row.category === category)
    .reduce((sum, row) => sum + Math.round(row.amount * 100), 0) / 100;
  return { total: total(), categories: OPERATION_EXPENSE_CATEGORIES.map(category => ({ category, amount: total(category) })) };
}

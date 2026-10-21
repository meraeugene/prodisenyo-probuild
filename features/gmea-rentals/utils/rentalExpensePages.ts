import type { RentalExpense } from "../types";
import type { RentalTransaction } from "../transactionTypes";
import { buildRentalReportingWeeks, rentalExpenseWeekMetadata, type RentalReportingWeek } from "./rentalReportingWeeks";
import { formatRentalDate } from "./rentalUi";

export type RentalExpensePage =
  | { id: string; label: string; week: RentalReportingWeek; expenses: RentalExpense[] }
  | { id: "other"; label: string; week: null; expenses: RentalExpense[] };

export function buildRentalExpensePages(expenses: RentalExpense[]): RentalExpensePage[] {
  const pages: RentalExpensePage[] = buildRentalReportingWeeks(expenses).map(week => ({
    id: week.id, label: `${formatRentalDate(week.start)} – ${formatRentalDate(week.end)}`, week, expenses: week.expenses,
  }));
  const other = expenses.filter(expense => !rentalExpenseWeekMetadata(expense.notes))
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id));
  if (other.length) pages.push({ id: "other", label: "Other expenses (no reporting week)", week: null, expenses: other });
  return pages;
}

export function selectRentalExpensePageRows(rows: RentalTransaction[], page?: RentalExpensePage): RentalTransaction[] {
  const byId = new Map(rows.filter(row => row.type === "expense").map(row => [row.expense.id, row]));
  return page?.expenses.flatMap(expense => {
    const row = byId.get(expense.id);
    return row ? [row] : [];
  }) || [];
}

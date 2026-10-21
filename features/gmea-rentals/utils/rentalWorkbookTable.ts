import type { RentalExpense } from "../types";
import { rentalVatBreakdown } from "./expenseCalculations";
import { rentalExpenseWeekMetadata } from "./rentalReportingWeeks";
import { rentalWorkbookWeekMetadata } from "./rentalWorkbookWeeks";

export const rentalWorkbookExpenseAmount = (expense: RentalExpense) => Math.round((rentalVatBreakdown(expense.amount, expense.vat_mode, expense.vat_rate).gross - expense.refunded_amount) * 100) / 100;
export const sumRentalWorkbookExpenses = (expenses: RentalExpense[]) => expenses.reduce((sum, expense) => sum + Math.round(rentalWorkbookExpenseAmount(expense) * 100), 0) / 100;
export const rentalWorkbookParty = (expense: RentalExpense) => rentalExpenseWeekMetadata(expense.notes)?.party || expense.supplier || expense.description;
export const rentalWorkbookKind = (expense: RentalExpense) => rentalWorkbookWeekMetadata(expense.notes)?.kind || rentalExpenseWeekMetadata(expense.notes)?.section;

export function rentalWorkbookEquipmentDates(expenses: RentalExpense[]) {
  const groups = new Map<string, RentalExpense[]>();
  const rows = expenses.filter(expense => rentalExpenseWeekMetadata(expense.notes)?.section === "equipment")
    .sort((left, right) => left.date.localeCompare(right.date)
      || (rentalExpenseWeekMetadata(left.notes)?.order ?? 0) - (rentalExpenseWeekMetadata(right.notes)?.order ?? 0) || left.id.localeCompare(right.id));
  for (const row of rows) groups.set(row.date, [...(groups.get(row.date) || []), row]);
  return [...groups].map(([date, rows]) => ({ date, rows }));
}

export function rentalWorkbookPayeeGroups(expenses: RentalExpense[]) {
  const groups = new Map<string, { id: string; date: string; title: string; rows: RentalExpense[] }>();
  const titles = { "cash-advance": "CA", salary: "SALARY", "13th-month": "PARTIAL 13TH / 13TH MONTH" };
  for (const expense of expenses) {
    const kind = rentalWorkbookKind(expense);
    if (!kind || kind === "equipment") continue;
    const id = `${kind}:${expense.date}`;
    const group = groups.get(id) || { id, date: expense.date, title: titles[kind], rows: [] };
    group.rows.push(expense); groups.set(id, group);
  }
  return [...groups.values()];
}

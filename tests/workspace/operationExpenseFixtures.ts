import type { OperationExpense } from "@/features/gmea-operation-expenses/types";

export const operationExpenses: OperationExpense[] = [
  ["2026-09-28", "Transportation", 100.15], ["2026-09-30", "Salary", 300],
  ["2026-10-01", "Water", 50.25], ["2026-10-04", "Electricity", 100], ["2026-10-05", "Salary", 400],
].map(([date, category, amount], index) => ({ id: `b0000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  date: String(date), category: category as OperationExpense["category"], amount: Number(amount), description: `${category} payment`,
  payee: "Office supplier", method: "Cash", reference: `OR-${index}`, notes: "", version: 1,
  created_by: "gmea", updated_by: "gmea", created_at: `${date}T08:00:00Z`, updated_at: `${date}T08:00:00Z` }));

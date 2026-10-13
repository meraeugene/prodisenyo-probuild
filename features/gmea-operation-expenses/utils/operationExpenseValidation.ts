import { OPERATION_EXPENSE_CATEGORIES, type OperationExpenseInput, type OperationExpenseCategory } from "../types";
import { validEquipmentId } from "@/features/gmea-rentals/utils/equipmentValidation";

export function normalizeOperationExpenseInput(input: unknown): OperationExpenseInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid operation expense.");
  const value = input as Record<string, unknown>;
  const text = (key: string, required = false, max = 200) => {
    const raw = value[key];
    if (typeof raw !== "string" || raw.trim().length > max || (required && !raw.trim())) throw new Error(`Enter a valid ${key}.`);
    return raw.trim();
  };
  const category = text("category", true) as OperationExpenseCategory;
  if (!OPERATION_EXPENSE_CATEGORIES.includes(category)) throw new Error("Select transportation, water, salary, or electricity.");
  const date = text("date", true, 10), parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date)
    throw new Error("Enter a valid expense date.");
  if (typeof value.amount !== "number" || !Number.isFinite(value.amount) || value.amount <= 0 || value.amount > 1e10)
    throw new Error("Enter an expense amount greater than zero.");
  const amount = Math.round(value.amount * 100) / 100;
  if (!amount) throw new Error("Enter at least 0.01 for the expense amount.");
  return { id: validEquipmentId(value.id), date, category, amount, description: text("description", true, 1000),
    payee: text("payee"), method: text("method", false, 100), reference: text("reference", false, 100), notes: text("notes", false, 1000) };
}

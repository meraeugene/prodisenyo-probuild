export const OPERATION_EXPENSE_CATEGORIES = ["Transportation", "Water", "Salary", "Electricity"] as const;
export type OperationExpenseCategory = (typeof OPERATION_EXPENSE_CATEGORIES)[number];
export type OperationExpenseInput = {
  id: string; date: string; category: OperationExpenseCategory; description: string;
  amount: number; payee: string; method: string; reference: string; notes: string;
};
export type OperationExpense = OperationExpenseInput & {
  version: number; created_by: string; updated_by: string; created_at: string; updated_at: string;
};

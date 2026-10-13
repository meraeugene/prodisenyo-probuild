import type { RentalExpense } from "../types";

export const rentalPaymentMethods = ["Cash", "GCash", "Cheque", "Bank transfer"];
export function buildRentalPayeeOptions(expenses: RentalExpense[]) {
  return [...new Set(["Drivers", "Operators", "Admin", "GMEA Admin", ...expenses.map(row => row.supplier.trim()).filter(Boolean)])];
}

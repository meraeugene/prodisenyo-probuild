import "server-only";
import { APP_ROLES, requireRole } from "@/lib/auth";
import { getGmeaExpenseOptions, getGmeaProjects } from "@/features/gmea-projects/server/gmeaQueries";
import { getGmeaRentalOperations, getGmeaRentals } from "@/features/gmea-rentals/server/gmeaRentalsQueries";
import { getHistoricalRentalIncome } from "@/features/gmea-rentals/server/historicalIncomeQueries";
import { getGmeaOperationExpenses } from "@/features/gmea-operation-expenses/server/operationExpensesQueries";
import { defaultGmeaInputOptions, mergeGmeaInputValues } from "../utils/gmeaInputOptions";
import type { GmeaInputOptions } from "../types";

export async function getGmeaInputOptions(): Promise<GmeaInputOptions> {
  await requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]);
  const [saved, projects, rentals, customerIncome, operations, operationExpenses] = await Promise.all([
    getGmeaExpenseOptions(), getGmeaProjects(), getGmeaRentals(), getHistoricalRentalIncome(), getGmeaRentalOperations(), getGmeaOperationExpenses(),
  ]);
  const income = [...rentals, ...customerIncome], projectExpenses = projects.flatMap(row => row.expenses);
  return {
    methods: mergeGmeaInputValues(saved.methods, defaultGmeaInputOptions.methods, projectExpenses.map(row => row.method),
      projects.flatMap(row => row.payment_terms.flatMap(term => term.receipts.map(receipt => receipt.method))),
      income.flatMap(row => row.payments.map(payment => payment.method)), operations.expenses.map(row => row.method), operationExpenses.map(row => row.method)),
    suppliers: mergeGmeaInputValues(saved.suppliers, defaultGmeaInputOptions.suppliers, projectExpenses.map(row => row.supplier), operations.expenses.map(row => row.supplier), operationExpenses.map(row => row.payee)),
    invoiceNames: mergeGmeaInputValues(saved.invoiceNames, projectExpenses.map(row => row.invoice_name)),
    clients: mergeGmeaInputValues(projects.map(row => row.client), income.map(row => row.client)),
    locations: mergeGmeaInputValues(projects.map(row => row.location), income.map(row => row.location)),
    services: mergeGmeaInputValues(income.flatMap(row => row.items.map(item => item.equipment_name))),
  };
}

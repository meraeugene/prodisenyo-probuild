import "server-only";
import { APP_ROLES, requireRole } from "@/lib/auth";
import { getGmeaProjects } from "@/features/gmea-projects/server/gmeaQueries";
import { getGmeaRentalOperations, getGmeaRentals } from "@/features/gmea-rentals/server/gmeaRentalsQueries";
import { getHistoricalRentalIncome } from "@/features/gmea-rentals/server/historicalIncomeQueries";
import { getGmeaOperationExpenses } from "@/features/gmea-operation-expenses/server/operationExpensesQueries";
import type { GmeaDashboardData } from "../types";

export async function getGmeaDashboardData(): Promise<GmeaDashboardData> {
  await requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]);
  const [projects, rentals, historicalIncome, operations, operationExpenses] = await Promise.all([
    getGmeaProjects(), getGmeaRentals(), getHistoricalRentalIncome(), getGmeaRentalOperations(), getGmeaOperationExpenses(),
  ]);
  return { projects, rentalIncome: [...rentals, ...historicalIncome], rentalExpenses: operations.expenses, operationExpenses };
}

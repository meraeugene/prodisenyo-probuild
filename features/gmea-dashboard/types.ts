import type { GmeaProject } from "@/features/gmea-projects/types";
import type { RentalIncomeRecord } from "@/features/gmea-rentals/incomeTypes";
import type { RentalExpense } from "@/features/gmea-rentals/types";
import type { OperationExpense } from "@/features/gmea-operation-expenses/types";

export type GmeaDashboardData = {
  projects: GmeaProject[]; rentalIncome: RentalIncomeRecord[]; rentalExpenses: RentalExpense[]; operationExpenses: OperationExpense[];
};

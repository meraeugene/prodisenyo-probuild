import type { RentalIncomeRecord } from "./incomeTypes";
import type { RentalExpense } from "./types";
import type { RentalIncomeRow } from "./utils/rentalWorkbookRecords";

export type RentalTransactionType = "all" | "income" | "expense";
export type RentalTransaction =
  | (RentalIncomeRow & { type: "income"; id: string; date: string })
  | { type: "expense"; id: string; date: string; expense: RentalExpense; rental: RentalIncomeRecord | null };

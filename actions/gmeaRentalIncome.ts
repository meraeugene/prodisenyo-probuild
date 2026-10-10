"use server";
import { getHistoricalRentalIncome } from "@/features/gmea-rentals/server/historicalIncomeQueries";

export async function getHistoricalRentalIncomeAction() {
  return getHistoricalRentalIncome();
}

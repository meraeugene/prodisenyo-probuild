import type { RentalIncomeRecord } from "../incomeTypes";
import type { RentalExpense } from "../types";
import { rentalIncomeCharge } from "./historicalIncomeMappers";
import { rentalClientKey, summarizeRentalIncome } from "./rentalIncomeSelectors";
import { summarizeRentalExpenses } from "./rentalExpensePeriods";

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export function summarizeRentalPortfolio(rentals: RentalIncomeRecord[], expenses: RentalExpense[]) {
  const income = summarizeRentalIncome(rentals.flatMap(rental => rental.payments
    .filter(payment => payment.status === "posted").map(payment => ({ rental, payment }))));
  const billable = rentals.filter(rental => rental.status !== "draft" && rental.status !== "cancelled");
  const charges = billable.map(rental => rentalIncomeCharge(rental));
  const outstanding = billable.reduce((total, rental) => {
    const charge = rentalIncomeCharge(rental);
    if (charge === null) return total;
    const collected = rental.payments.filter(payment => payment.status === "posted")
      .reduce((sum, payment) => sum + payment.amount, 0);
    // An overpayment on one rental must not reduce another rental's balance.
    return total + Math.max(0, roundMoney(charge - collected));
  }, 0);
  return { ...income, charge: roundMoney(charges.reduce<number>((total, value) => total + (value ?? 0), 0)),
    outstanding: roundMoney(outstanding), unconfirmedCharges: charges.filter(value => value === null).length,
    expenses: summarizeRentalExpenses(expenses).net };
}

export type RentalPortfolioSummary = ReturnType<typeof summarizeRentalPortfolio>;
export type RentalLocation = {
  key: string; name: string; clients: string[]; rentals: RentalIncomeRecord[];
  expenses: RentalExpense[]; summary: RentalPortfolioSummary;
};

export function buildRentalLocations(rentals: RentalIncomeRecord[], expenses: RentalExpense[]): RentalLocation[] {
  const groups = new Map<string, RentalIncomeRecord[]>();
  for (const rental of rentals) {
    const key = rental.location.trim() ? `location:${rentalClientKey(rental.location)}` : `missing:${rentalClientKey(rental.client)}`;
    groups.set(key, [...(groups.get(key) ?? []), rental]);
  }
  return [...groups.entries()].map(([key, rows]) => {
    const ids = new Set(rows.map(row => row.id));
    const linkedExpenses = expenses.filter(expense => ids.has(expense.rental_id || expense.income_record_id || ""));
    return { key, name: rows[0].location.trim() || "Location not recorded",
      clients: [...new Set(rows.map(row => row.client.trim()))], rentals: rows, expenses: linkedExpenses,
      summary: summarizeRentalPortfolio(rows, linkedExpenses) };
  }).sort((left, right) => left.name.localeCompare(right.name) || left.key.localeCompare(right.key));
}

export function filterRentalLocations(locations: RentalLocation[], query: string) {
  const search = rentalClientKey(query);
  return locations.filter(location => [location.name, ...location.clients, ...location.rentals.map(row => row.rental_number)]
    .some(value => rentalClientKey(value).includes(search)));
}

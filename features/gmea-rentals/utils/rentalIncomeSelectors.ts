import type { RentalPayment, RentalPaymentType } from "../types";
import type { RentalIncomeRecord } from "../incomeTypes";
import { rentalIncomeCharge } from "./historicalIncomeMappers";

export const rentalPaymentTypeLabels: Record<RentalPaymentType, string> = {
  down_payment: "Down Payment",
  full_payment: "Full Payment",
  partial_payment: "Additional installment",
  unclassified: "Unclassified",
};

export type RentalIncomeTransaction = { rental: RentalIncomeRecord; payment: RentalPayment };
export type RentalIncomeCompany = {
  key: string;
  name: string;
  locations: string[];
  rentals: RentalIncomeRecord[];
  downPayment: number;
  fullPayment: number;
  otherPayments: number;
  collected: number;
  outstanding: number;
  unconfirmedBalances: number;
};

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;
export const rentalClientKey = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

export function latestRentalIncomeMonth(rentals: RentalIncomeRecord[], fallback: string) {
  return rentals.flatMap(rental => rental.payments.filter(payment => payment.status === "posted")
    .map(payment => payment.payment_date.slice(0, 7))).sort().at(-1) || fallback;
}

export function selectRentalIncomeRentals(rentals: RentalIncomeRecord[], query: string, company: string) {
  const search = query.trim().toLowerCase();
  return rentals.filter(rental => (!company || rentalClientKey(rental.client) === company)
    && [rental.client, rental.location, rental.rental_number, ...rental.items.map(item => item.equipment_name)]
      .some(value => value.toLowerCase().includes(search)));
}

export function selectRentalIncomeTransactions(rentals: RentalIncomeRecord[], month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return [];
  return rentals.flatMap(rental => rental.payments
    .filter(payment => payment.status === "posted" && payment.payment_date.slice(0, 7) === month)
    .map(payment => ({ rental, payment })))
    .sort((left, right) => left.payment.payment_date.localeCompare(right.payment.payment_date)
      || left.payment.recorded_at.localeCompare(right.payment.recorded_at) || left.payment.id.localeCompare(right.payment.id));
}

export function summarizeRentalIncome(transactions: RentalIncomeTransaction[]) {
  const sum = (types: RentalPaymentType[]) => roundMoney(transactions
    .filter(({ payment }) => types.includes(payment.payment_type ?? "unclassified"))
    .reduce((total, { payment }) => total + payment.amount, 0));
  return {
    downPayment: sum(["down_payment"]),
    fullPayment: sum(["full_payment"]),
    otherPayments: sum(["partial_payment", "unclassified"]),
    unclassifiedCount: transactions.filter(({ payment }) => !payment.payment_type || payment.payment_type === "unclassified").length,
    collected: roundMoney(transactions.reduce((total, { payment }) => total + payment.amount, 0)),
    companies: new Set(transactions.map(({ rental }) => rentalClientKey(rental.client))).size,
  };
}

export function rentalOutstandingAtMonthEnd(rental: RentalIncomeRecord, month: string) {
  if (rental.historical && rentalIncomeCharge(rental) === null) return 0;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || rental.status === "draft" || rental.status === "cancelled"
    || rental.start_date.slice(0, 7) > month) return 0;
  const charge = rentalIncomeCharge(rental) ?? 0;
  const collected = rental.payments.filter(payment => payment.status === "posted" && payment.payment_date.slice(0, 7) <= month)
    .reduce((total, payment) => total + payment.amount, 0);
  return Math.max(0, roundMoney(charge - collected));
}

export function buildRentalIncomeCompanies(rentals: RentalIncomeRecord[], month: string): RentalIncomeCompany[] {
  const groups = new Map<string, RentalIncomeRecord[]>();
  for (const rental of rentals) {
    const key = rentalClientKey(rental.client);
    groups.set(key, [...(groups.get(key) ?? []), rental]);
  }
  return [...groups.entries()].map(([key, rows]) => {
    const summary = summarizeRentalIncome(selectRentalIncomeTransactions(rows, month));
    return { key, name: rows[0].client.trim(), locations: [...new Set(rows.map(row => row.location).filter(Boolean))],
      rentals: rows, ...summary, unconfirmedBalances: rows.filter(row => rentalIncomeCharge(row) === null).length,
      outstanding: roundMoney(rows.reduce((total, row) => total + rentalOutstandingAtMonthEnd(row, month), 0)) };
  }).sort((left, right) => right.collected - left.collected || left.name.localeCompare(right.name));
}

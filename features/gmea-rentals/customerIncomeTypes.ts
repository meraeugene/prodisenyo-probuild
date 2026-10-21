import type { RentalPayment } from "./types";

export type CustomerIncomeEntry = {
  id: string; client: string; location: string; service: string; total_amount: number;
  payments: RentalPayment[]; version: number; created_at: string; created_by: string; updated_at?: string;
};
export type CustomerIncomeInput = {
  id: string; version: number | null; client: string; location: string; service: string; total_amount: number;
  down_payment: number; down_payment_date: string; full_payment: number; full_payment_date: string; method: string;
};

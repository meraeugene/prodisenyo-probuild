import type { GmeaRental, RentalPaymentType } from "./types";

export type HistoricalIncomeReceipt = {
  id: string; amount: number; date: string | null; type: RentalPaymentType;
  method: string; source: string; confirmed: boolean;
};
export type HistoricalIncomeRecord = {
  id: string; client: string; location: string; service: string; source: string;
  charge: number | null; issues: string[]; receipts: HistoricalIncomeReceipt[];
  sourceRows: Record<string, string | number>[];
  revision?: number;
  deleted?: boolean;
  importRevision?: string;
  updatedBy?: string;
  updatedAt?: string;
};
export type RentalIncomeRecord = Pick<GmeaRental,
  "id" | "rental_number" | "client" | "location" | "items" | "payments" | "status" | "start_date"> & {
  historical?: HistoricalIncomeRecord;
  customerIncome?: { version: number };
  version?: number;
};
export type RentalIncomeImport = {
  source_name: string; source_hash: string; parser_version: number;
  records: HistoricalIncomeRecord[]; source_snapshot: unknown;
};

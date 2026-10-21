import type { RentalIncomeRecord } from "../incomeTypes";
import { rentalIncomeCharge } from "./historicalIncomeMappers";

export type RentalIncomeRecordEdit = {
  id: string; origin: "customer" | "historical" | "booking"; version: number;
  client: string; location: string; service: string; charge: number | null;
};
export function rentalIncomeRecordEdit(record: RentalIncomeRecord): RentalIncomeRecordEdit {
  return { id: record.id, origin: record.customerIncome ? "customer" : record.historical ? "historical" : "booking",
    version: record.customerIncome?.version ?? record.historical?.revision ?? record.version ?? 1,
    client: record.client, location: record.location, service: record.items.map(item => item.equipment_name).join(", ").slice(0, 200), charge: rentalIncomeCharge(record) };
}
export function normalizeRentalIncomeRecordEdit(input: unknown): RentalIncomeRecordEdit {
  if (!input || typeof input !== "object") throw new Error("Select a valid rental income record.");
  const value = input as RentalIncomeRecordEdit;
  if (!value || typeof value.id !== "string" || !value.id.trim() || value.id.length > 200
    || !["customer", "historical", "booking"].includes(value.origin) || !Number.isInteger(value.version) || value.version < 1) throw new Error("Reload this rental income record before saving.");
  for (const key of ["client", "location", "service"] as const) {
    if (typeof value[key] !== "string" || value[key].trim().length > 200) throw new Error(`Enter a valid ${key}.`);
  }
  if (!value.client.trim() || value.origin === "customer" && !value.location.trim()) throw new Error("Enter the company and location.");
  if (value.charge !== null && (typeof value.charge !== "number" || !Number.isFinite(value.charge) || value.charge < 0 || value.charge > 1e10)
    || value.origin === "customer" && (value.charge === null || value.charge <= 0)) throw new Error("Enter a valid rental amount.");
  return { id: value.id, origin: value.origin, version: value.version, client: value.client.trim(), location: value.location.trim(), service: value.service.trim(), charge: value.charge === null ? null : Math.round(value.charge * 100) / 100 };
}

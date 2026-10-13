import type { CustomerIncomeInput } from "../customerIncomeTypes";
import { validEquipmentId } from "./equipmentValidation";

function text(value: unknown, label: string, required = false, max = 200) {
  if (typeof value !== "string" || value.trim().length > max || (required && !value.trim())) throw new Error(`Enter a valid ${label}.`);
  return value.trim();
}
function amount(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1e10) throw new Error(`Enter a valid ${label}.`);
  return Math.round(value * 100) / 100;
}
function receiptDate(value: unknown, paid: number) {
  if (!paid) return "";
  const date = text(value, "payment date", true, 10);
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date
    || date > new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })) throw new Error("Enter an actual payment date that is not in the future.");
  return date;
}
export function normalizeCustomerIncomeInput(input: unknown): CustomerIncomeInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid rental income.");
  const value = input as Record<string, unknown>;
  const total = amount(value.total_amount, "total rental amount");
  const down = amount(value.down_payment, "down payment"), full = amount(value.full_payment, "full payment");
  if (total <= 0 || down + full <= 0 || Math.round((down + full) * 100) > Math.round(total * 100)) throw new Error("Enter a total amount and payments within that amount.");
  if (value.version !== null && (!Number.isInteger(value.version) || Number(value.version) < 1)) throw new Error("Reload this income record before saving.");
  return { id: validEquipmentId(value.id), version: value.version as number | null, client: text(value.client, "company name", true),
    location: text(value.location, "location", true), service: text(value.service, "rental service"), total_amount: total,
    down_payment: down, full_payment: full, down_payment_date: receiptDate(value.down_payment_date, down),
    full_payment_date: receiptDate(value.full_payment_date, full), method: text(value.method, "mode of payment", true, 100) };
}

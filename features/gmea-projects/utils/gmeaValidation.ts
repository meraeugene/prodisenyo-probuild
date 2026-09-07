import type { GmeaMutation, ProjectInput, VatMode } from "../types";
import { money, sumMoney, vatBreakdown } from "./gmeaCalculations";
import { EXPENSE_CATEGORIES, PROJECT_STATUSES } from "./gmeaConstants";

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid entry.");
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, required = false, max = 2000) {
  if (typeof value !== "string") {
    if (!required && value == null) return "";
    throw new Error(label + " is invalid.");
  }
  const result = value.trim();
  if ((required && !result) || result.length > max)
    throw new Error(
      label + " is required and must be within " + max + " characters.",
    );
  return result;
}

export function validId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new Error("Invalid record identifier.");
  return value;
}

function number(value: unknown, label: string, max = 1e10) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > max
  )
    throw new Error(label + " must be a valid nonnegative number.");
  return value;
}

function date(value: unknown) {
  const result = text(value, "Date", true, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(result) ||
    !Number.isFinite(Date.parse(result)) ||
    new Date(result).toISOString().slice(0, 10) !== result
  )
    throw new Error("Enter a valid date.");
  return result;
}

function array(value: unknown, max = 500) {
  if (!Array.isArray(value) || value.length > max)
    throw new Error("Invalid entry list.");
  return value.map(object);
}

function vat(value: Record<string, unknown>) {
  const mode = text(value.vat_mode, "VAT mode", true) as VatMode;
  const rate =
    mode === "off" ? 0 : money(number(value.vat_rate, "VAT rate", 100));
  vatBreakdown(0, mode, rate);
  return { vat_mode: mode, vat_rate: rate };
}

export function normalizeProject(value: unknown): ProjectInput {
  const project = object(value);
  const status = project.status as ProjectInput["status"];
  if (!PROJECT_STATUSES.includes(status))
    throw new Error("Select a project status.");
  const contractAmount = money(
    number(project.contract_amount, "Contract amount"),
  );
  if (contractAmount <= 0)
    throw new Error("Contract amount must be greater than zero.");
  return {
    name: text(project.name, "Project name", true, 200),
    client: text(project.client, "Client", false, 200),
    location: text(project.location, "Project location", true, 300),
    contract_amount: contractAmount,
    withholding_tax_rate:
      Math.round(number(project.withholding_tax_rate, "Withholding tax rate", 100) * 10000) /
      10000,
    duration: text(project.duration, "Project duration", true, 100),
    status,
  };
}

export function normalizeMutation(input: unknown): GmeaMutation {
  const command = object(input);
  const kind = command.kind;
  if (kind === "project")
    return { kind, value: normalizeProject(command.value) };
  if (kind === "delete") {
    if (command.entity !== "expense") throw new Error("Invalid entry type.");
    return { kind, entity: "expense", id: validId(command.id) };
  }
  if (kind === "partners") {
    const rows = array(command.value, 30).map((row) => ({
      id: validId(row.id),
      name: text(row.name, "Partner name", true, 200),
      percentage: money(number(row.percentage, "Percentage", 100)),
    }));
    if (!rows.length || new Set(rows.map((row) => row.id)).size !== rows.length)
      throw new Error("Add at least one unique partner.");
    if (sumMoney(rows.map((row) => row.percentage)) !== 100)
      throw new Error("Percentages must total 100%.");
    return { kind, value: rows };
  }
  if (kind === "expense") {
    const value = object(command.value);
    const amount = money(number(value.amount, "Expense amount"));
    if (amount <= 0 || !EXPENSE_CATEGORIES.includes(String(value.category)))
      throw new Error("Enter a positive expense amount and select a category.");
    return {
      kind,
      value: {
        id: validId(value.id),
        date: date(value.date),
        description: text(value.description, "Description", true),
        category: String(value.category),
        supplier: text(value.supplier, "Supplier", false, 200),
        invoice_number: text(value.invoice_number, "Invoice number", false, 100),
        invoice_name: text(value.invoice_name, "Invoice issued to", false, 200),
        amount,
        ...vat(value),
        method: text(value.method, "Payment method", true, 100),
        notes: text(value.notes, "Notes"),
      },
    };
  }
  throw new Error("Invalid operation.");
}

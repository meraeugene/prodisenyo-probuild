import type { GmeaMutation, ProjectInput, Quotation, VatMode } from "../types";
import {
  money,
  quotationTotals,
  sumMoney,
  vatBreakdown,
} from "./gmeaCalculations";
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
function date(value: unknown, required = true) {
  if (!required && (value == null || value === "")) return null;
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
  const p = object(value);
  const status = p.status as ProjectInput["status"];
  if (!PROJECT_STATUSES.includes(status))
    throw new Error("Select a project status.");
  const start_date = date(p.start_date, false),
    end_date = date(p.end_date, false);
  if (start_date && end_date && end_date < start_date)
    throw new Error("End date cannot precede start date.");
  return {
    name: text(p.name, "Project name", true, 200),
    location: text(p.location, "Location", true, 300),
    client: text(p.client, "Client", false, 200),
    description: text(p.description, "Description"),
    duration: text(p.duration, "Duration", false, 100),
    start_date,
    end_date,
    status,
  };
}
export function normalizeMutation(input: unknown): GmeaMutation {
  const command = object(input);
  const kind = command.kind;
  if (kind === "project")
    return { kind, value: normalizeProject(command.value) };
  if (kind === "accept") return { kind, id: validId(command.id) };
  if (kind === "delete") {
    if (!["quotation", "receipt", "expense"].includes(String(command.entity)))
      throw new Error("Invalid entry type.");
    return {
      kind,
      entity: command.entity as "quotation" | "receipt" | "expense",
      id: validId(command.id),
    };
  }
  if (kind === "partners" || kind === "milestones") {
    const rows = array(command.value, 30).map((row) => ({
      id: validId(row.id),
      name: text(kind === "partners" ? row.name : row.label, "Name", true, 200),
      percentage: money(number(row.percentage, "Percentage", 100)),
    }));
    if (new Set(rows.map((r) => r.id)).size !== rows.length)
      throw new Error("Duplicate entries are not allowed.");
    const total = sumMoney(rows.map((r) => r.percentage));
    if (
      (kind === "partners" && (!rows.length || total !== 100)) ||
      (kind === "milestones" && rows.length > 0 && total !== 100)
    )
      throw new Error("Percentages must total 100%.");
    if (kind === "partners") return { kind, value: rows };
    return {
      kind,
      value: rows.map((r) => ({
        id: r.id,
        label: r.name,
        percentage: r.percentage,
      })),
    };
  }
  const v = object(command.value);
  if (kind === "quotation") {
    const items = array(v.items).map((row) => ({
      description: text(row.description, "Item description", true, 1000),
      unit: text(row.unit, "Unit", true, 30),
      quantity:
        Math.round(number(row.quantity, "Quantity", 1e8) * 10000) / 10000,
      unit_price: money(number(row.unit_price, "Unit price")),
    }));
    if (!items.length) throw new Error("Add at least one quotation item.");
    const quote: Quotation = {
      id: validId(v.id),
      project_id: "",
      reference: text(v.reference, "Quotation reference", true, 100),
      date: date(v.date)!,
      notes: text(v.notes, "Notes"),
      status: "draft",
      discount: money(number(v.discount, "Discount")),
      ...vat(v),
      total: 0,
      items,
    };
    quote.total = quotationTotals(quote).gross;
    if (quote.total <= 0)
      throw new Error("Quotation total must be greater than zero.");
    return { kind, value: quote };
  }
  if (kind === "receipt") {
    const cash = money(number(v.cash, "Cash received")),
      withholding = money(number(v.withholding, "Withholding"));
    if (cash + withholding <= 0)
      throw new Error("Enter cash received or withholding.");
    return {
      kind,
      value: {
        id: validId(v.id),
        milestone_id: v.milestone_id ? validId(v.milestone_id) : null,
        date: date(v.date)!,
        cash,
        withholding,
        method: text(v.method, "Payment method", true, 100),
        reference: text(v.reference, "Reference", false, 200),
        notes: text(v.notes, "Notes"),
      },
    };
  }
  if (kind === "expense") {
    const amount = money(number(v.amount, "Expense amount"));
    if (amount <= 0 || !EXPENSE_CATEGORIES.includes(String(v.category)))
      throw new Error("Enter a positive expense amount and select a category.");
    return {
      kind,
      value: {
        id: validId(v.id),
        date: date(v.date)!,
        description: text(v.description, "Description", true),
        category: String(v.category),
        supplier: text(v.supplier, "Supplier", false, 200),
        invoice_number: text(v.invoice_number, "Invoice number", false, 100),
        invoice_name: text(v.invoice_name, "Invoice name", false, 200),
        amount,
        ...vat(v),
        method: text(v.method, "Payment method", true, 100),
        notes: text(v.notes, "Notes"),
      },
    };
  }
  throw new Error("Invalid operation.");
}

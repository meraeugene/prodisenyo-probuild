import type {
  ContractTermsInput,
  GmeaMutation,
  PaymentTermValueMode,
  ProjectDetailsInput,
  VatMode,
} from "../types";
import { money, sumMoney, vatBreakdown } from "./gmeaCalculations";
import { EXPENSE_CATEGORIES } from "./gmeaConstants";
import { normalizeProjectDuration } from "./gmeaFormatters";

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
  const rate = mode === "off" ? 0 : 12;
  vatBreakdown(0, mode, rate);
  return { vat_mode: mode, vat_rate: rate };
}

export function normalizeProjectDetails(value: unknown): ProjectDetailsInput {
  const project = object(value);
  return {
    name: text(project.name, "Project name", true, 200),
    client: text(project.client, "Client", false, 200),
    location: text(project.location, "Project location", true, 300),
    duration: normalizeProjectDuration(
      text(project.duration, "Project duration", true, 100),
    ),
  };
}

export function normalizeContractTerms(value: unknown): ContractTermsInput {
  const contract = object(value);
  const contractAmount = money(
    number(contract.contract_amount, "Contract amount"),
  );
  if (contractAmount <= 0)
    throw new Error("Contract amount must be greater than zero.");

  let lastPercentageIndex = -1;
  const rows = array(contract.payment_terms, 30).map((row, index) => {
    const mode = text(row.value_mode, "Value mode", true, 20);
    if (mode !== "percentage" && mode !== "fixed")
      throw new Error("Select percentage or fixed amount for every term.");
    const valueMode = mode as PaymentTermValueMode;
    const percentage =
      mode === "percentage"
        ? number(row.percentage, "Percentage", 100)
        : null;
    if (percentage !== null && percentage <= 0)
      throw new Error("Percentages must be greater than zero.");
    if (percentage !== null) lastPercentageIndex = index;
    const amount =
      mode === "percentage"
        ? money((contractAmount * percentage!) / 100)
        : money(number(row.amount, "Payment term amount"));
    if (amount <= 0)
      throw new Error("Payment term amounts must be greater than zero.");
    return {
      id: validId(row.id),
      description: text(row.description, "Description", true, 300),
      value_mode: valueMode,
      percentage,
      amount,
      notes: text(row.notes, "Notes", false, 1000),
    };
  });
  if (!rows.length) throw new Error("Add at least one payment term.");
  if (new Set(rows.map((row) => row.id)).size !== rows.length)
    throw new Error("Payment terms must have unique identifiers.");

  const difference = money(
    contractAmount - sumMoney(rows.map((row) => row.amount)),
  );
  if (Math.abs(difference) > 0.01)
    throw new Error("Payment terms must total the contract amount.");
  if (difference && lastPercentageIndex >= 0)
    rows[lastPercentageIndex].amount = money(
      rows[lastPercentageIndex].amount + difference,
    );
  if (sumMoney(rows.map((row) => row.amount)) !== contractAmount)
    throw new Error("Payment terms must total the contract amount.");

  return { contract_amount: contractAmount, payment_terms: rows };
}

export function normalizeMutation(input: unknown): GmeaMutation {
  const command = object(input);
  const kind = command.kind;
  if (kind === "create_project") {
    const value = object(command.value);
    return {
      kind,
      value: {
        details: normalizeProjectDetails(value.details),
        contract: normalizeContractTerms(value.contract),
      },
    };
  }
  if (kind === "project_details")
    return { kind, value: normalizeProjectDetails(command.value) };
  if (kind === "contract_terms")
    return { kind, value: normalizeContractTerms(command.value) };
  if (kind === "delete_project") return { kind };
  if (kind === "delete") {
    if (command.entity !== "expense")
      throw new Error("Invalid entry type.");
    return { kind, entity: command.entity, id: validId(command.id) };
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
    const category = String(value.category);
    if (
      amount <= 0 ||
      !EXPENSE_CATEGORIES.includes(
        category as (typeof EXPENSE_CATEGORIES)[number],
      )
    )
      throw new Error("Enter a positive expense amount and select a category.");
    return {
      kind,
      value: {
        id: validId(value.id),
        date: date(value.date),
        description: text(value.description, "Description", true),
        category,
        supplier: text(value.supplier, "Supplier", false, 200),
        invoice_number: text(value.invoice_number, "Invoice number", false, 100),
        invoice_name: text(value.invoice_name, "Invoice issued to", false, 200),
        amount,
        refunded_amount: money(
          number(value.refunded_amount ?? 0, "Refunded amount"),
        ),
        ...vat(value),
        method: text(value.method, "Payment method", true, 100),
      },
    };
  }
  if (kind === "record_receipt") {
    const value = object(command.value);
    const amount = money(number(value.amount, "Receipt amount"));
    if (amount <= 0) throw new Error("Receipt amount must be greater than zero.");
    const receivedDate = date(value.received_date);
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    });
    if (receivedDate > today)
      throw new Error("Receipt date cannot be in the future.");
    return {
      kind,
      value: {
        id: validId(value.id),
        term_id: validId(value.term_id),
        amount,
        received_date: receivedDate,
        method: text(value.method, "Payment method", false, 100),
        reference_number: text(
          value.reference_number,
          "Reference number",
          false,
          100,
        ),
        notes: text(value.notes, "Notes", false, 1000),
      },
    };
  }
  if (kind === "void_receipt") {
    return {
      kind,
      receipt_id: validId(command.receipt_id),
      reason: text(command.reason, "Void reason", true, 500),
    };
  }
  throw new Error("Invalid operation.");
}

import {
  RENTAL_WORKER_ROLES,
  type RentalAssignmentMutation,
  type RentalExpenseMutation,
  type RentalVatMode,
  type RentalWorkerMutation,
} from "../types";
import { validEquipmentId } from "./equipmentValidation";
import { rentalVatBreakdown } from "./expenseCalculations";

function object(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid operation.");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, required = false, max = 500) {
  if (typeof value !== "string") throw new Error(label + " is invalid.");
  const result = value.trim();
  if ((required && !result) || result.length > max) {
    throw new Error(
      label + " is required and must be within " + max + " characters.",
    );
  }
  return result;
}

function optionalId(value: unknown) {
  return value === null || value === "" || value === undefined
    ? null
    : validEquipmentId(value);
}

function money(value: unknown, label: string, positive = false) {
  const result = Math.round(Number(value) * 100) / 100;
  if (
    !Number.isFinite(result) ||
    result < 0 ||
    (positive && result <= 0) ||
    result > 1e10
  ) {
    throw new Error(
      label + (positive ? " must be greater than zero." : " is invalid."),
    );
  }
  return result;
}

export function normalizeRentalWorkerMutation(
  input: unknown,
): RentalWorkerMutation {
  const command = object(input);
  if (command.kind === "deactivate") return { kind: "deactivate" };
  if (command.kind !== "create" && command.kind !== "update") {
    throw new Error("Invalid worker operation.");
  }
  const value = object(command.value);
  const role = text(value.role, "Role", true, 20);
  if (
    !RENTAL_WORKER_ROLES.includes(role as (typeof RENTAL_WORKER_ROLES)[number])
  ) {
    throw new Error("Select a valid worker role.");
  }
  return {
    kind: command.kind,
    value: {
      name: text(value.name, "Worker name", true, 200),
      role: role as (typeof RENTAL_WORKER_ROLES)[number],
      phone: text(value.phone, "Phone", false, 50),
      is_active: Boolean(value.is_active),
    },
  };
}

export function normalizeRentalAssignmentMutation(
  input: unknown,
): RentalAssignmentMutation {
  const command = object(input);
  if (command.kind === "remove_assignment") {
    return {
      kind: "remove_assignment",
      assignment_id: validEquipmentId(command.assignment_id),
    };
  }
  if (command.kind !== "assign_worker") {
    throw new Error("Invalid assignment operation.");
  }
  const value = object(command.value);
  return {
    kind: "assign_worker",
    value: {
      id: validEquipmentId(value.id),
      worker_id: validEquipmentId(value.worker_id),
      equipment_id: optionalId(value.equipment_id),
    },
  };
}

export function normalizeRentalExpenseMutation(
  input: unknown,
): RentalExpenseMutation {
  const command = object(input);
  if (command.kind === "delete") return { kind: "delete" };
  if (command.kind !== "create" && command.kind !== "update") {
    throw new Error("Invalid rental expense operation.");
  }
  const value = object(command.value);
  const date = text(value.date, "Expense date", true, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    throw new Error("Enter a valid expense date.");
  }
  const vatMode = text(
    value.vat_mode,
    "VAT treatment",
    true,
    20,
  ) as RentalVatMode;
  const vatRate = vatMode === "off" ? 0 : 12;
  const amount = money(value.amount, "Expense amount", true);
  rentalVatBreakdown(amount, vatMode, vatRate);
  return {
    kind: command.kind,
    value: {
      id: validEquipmentId(value.id),
      rental_id: optionalId(value.rental_id),
      equipment_id: optionalId(value.equipment_id),
      category_id: validEquipmentId(value.category_id),
      date,
      description: text(value.description, "Description", true, 1000),
      supplier: text(value.supplier, "Supplier or payee", false, 200),
      method: text(value.method, "Payment method", false, 100),
      invoice_number: text(
        value.invoice_number,
        "OR or invoice number",
        false,
        100,
      ),
      amount,
      refunded_amount: money(value.refunded_amount, "Refunded amount"),
      vat_mode: vatMode,
      vat_rate: vatRate,
      notes: text(value.notes, "Notes", false, 1000),
      version: Number(value.version) || 1,
    },
  };
}

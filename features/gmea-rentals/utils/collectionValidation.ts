import type { RentalCollectionMutation } from "../types";
import { validEquipmentId } from "./equipmentValidation";

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

function paymentDate(value: unknown) {
  const result = text(value, "Payment date", true, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(result))) {
    throw new Error("Enter a valid payment date.");
  }
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  });
  if (result > today) throw new Error("Payment date cannot be in the future.");
  return result;
}

export function normalizeRentalCollectionMutation(
  input: unknown,
): RentalCollectionMutation {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid rental collection operation.");
  }
  const command = input as Record<string, unknown>;
  if (command.kind === "record_payment") {
    if (
      !command.value ||
      typeof command.value !== "object" ||
      Array.isArray(command.value)
    ) {
      throw new Error("Invalid payment.");
    }
    const value = command.value as Record<string, unknown>;
    const amount = Math.round(Number(value.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e10) {
      throw new Error("Payment amount must be greater than zero.");
    }
    return {
      kind: "record_payment",
      value: {
        id: validEquipmentId(value.id),
        amount,
        payment_date: paymentDate(value.payment_date),
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
  if (command.kind === "void_payment") {
    return {
      kind: "void_payment",
      payment_id: validEquipmentId(command.payment_id),
      reason: text(command.reason, "Void reason", true, 500),
    };
  }
  throw new Error("Invalid rental collection operation.");
}

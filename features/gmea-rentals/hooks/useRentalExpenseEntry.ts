"use client";
import { useState } from "react";
import type { RentalOperationsData } from "../types";
import { buildRentalPayeeOptions } from "../utils/rentalEntryOptions";
import { normalizeRentalExpenseMutation } from "../utils/operationsValidation";
import { useGmeaRentalOperationsMutation } from "./useGmeaRentalOperationsMutation";

export function useRentalExpenseEntry(operations: RentalOperationsData, onClose: () => void) {
  const categories = operations.categories.filter(row => row.is_active);
  const [form, setForm] = useState(() => ({ id: crypto.randomUUID(), date: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }),
    category_id: categories[0]?.id || "", description: "", amount: "", supplier: "", method: "", invoice_number: "", notes: "" }));
  const [localError, setLocalError] = useState("");
  const { saveExpense, pending, error } = useGmeaRentalOperationsMutation();
  const set = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  async function submit() {
    if (pending) return;
    setLocalError("");
    try {
      const command = normalizeRentalExpenseMutation({ kind: "create", value: { ...form, amount: Number(form.amount),
        rental_id: null, equipment_id: null, vat_mode: "off", vat_rate: 0, refunded_amount: 0, version: 1 } });
      await saveExpense(null, command);
      onClose();
    } catch (cause) { setLocalError(cause instanceof Error ? cause.message : "Unable to save rental expense."); }
  }
  return { form, set, categories, payees: buildRentalPayeeOptions(operations.expenses), pending, error: localError || error, submit };
}

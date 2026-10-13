"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { saveCustomerRentalIncomeAction } from "@/actions/gmeaCustomerIncome";
import type { RentalIncomeRecord } from "../incomeTypes";
import { rentalIncomeCharge } from "../utils/historicalIncomeMappers";
import { normalizeCustomerIncomeInput } from "../utils/customerIncomeValidation";

function blankIncomeForm() {
  return { id: crypto.randomUUID(), client: "", location: "", service: "", total_amount: "", down_payment: "",
    down_payment_date: "", full_payment: "", full_payment_date: "", method: "" };
}
export function useCustomerIncomeForm(record: RentalIncomeRecord | undefined, onClose: () => void) {
  const router = useRouter();
  const existing = record?.customerIncome ? record : undefined;
  const [form, setForm] = useState(() => existing ? { ...blankIncomeForm(), id: existing.id, client: existing.client, location: existing.location,
    service: existing.items[0]?.equipment_name || "", total_amount: String(rentalIncomeCharge(existing) ?? 0) } : blankIncomeForm());
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  function set(key: keyof typeof form, value: string) { setError(""); setForm(current => ({ ...current, [key]: value })); }
  async function submit() {
    if (pending) return;
    setPending(true); setError("");
    try {
      const input = normalizeCustomerIncomeInput({ ...form, version: existing?.customerIncome?.version ?? null,
        total_amount: Number(form.total_amount), down_payment: Number(form.down_payment || 0), full_payment: Number(form.full_payment || 0) });
      await saveCustomerRentalIncomeAction(input);
      await mutate("gmea-rentals:income-history");
      await mutate("gmea-dashboard:overview");
      await mutate("gmea-input-options");
      router.refresh(); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save rental income."); }
    finally { setPending(false); }
  }
  const collected = existing?.payments.filter(payment => payment.status === "posted").reduce((sum, payment) => sum + payment.amount, 0) ?? 0;
  return { form, set, existing, collected, pending, error, submit };
}

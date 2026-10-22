"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useGmeaCacheRefresh } from "@/features/gmea-forms/hooks/useGmeaCacheRefresh";
import { saveCustomerRentalIncomeAction } from "@/actions/gmeaCustomerIncome";
import type { RentalIncomeRecord } from "../incomeTypes";
import { rentalIncomeCharge } from "../utils/historicalIncomeMappers";
import { normalizeCustomerIncomeInput } from "../utils/customerIncomeValidation";

function blankIncomeForm() {
  return { id: crypto.randomUUID(), client: "", location: "", service: "", total_amount: "", down_payment: "",
    down_payment_date: "", full_payment: "", full_payment_date: "", method: "" };
}
export function useCustomerIncomeForm(record: RentalIncomeRecord | undefined, onClose: () => void) {
  const refresh = useGmeaCacheRefresh();
  const saving = useRef(false);
  const existing = record?.customerIncome ? record : undefined;
  const [form, setForm] = useState(() => existing ? { ...blankIncomeForm(), id: existing.id, client: existing.client, location: existing.location,
    service: existing.items[0]?.equipment_name || "", total_amount: String(rentalIncomeCharge(existing) ?? 0) } : blankIncomeForm());
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  function set(key: keyof typeof form, value: string) { setError(""); setForm(current => ({ ...current, [key]: value })); }
  async function submit() {
    if (saving.current) return;
    saving.current = true;
    setPending(true); setError("");
    try {
      const input = normalizeCustomerIncomeInput({ ...form, version: existing?.customerIncome?.version ?? null,
        total_amount: Number(form.total_amount), down_payment: Number(form.down_payment || 0), full_payment: Number(form.full_payment || 0) });
      await saveCustomerRentalIncomeAction(input);
      toast.success(existing ? "Rental payment added successfully." : "Rental income added successfully.");
      refresh(["gmea-rentals:income-history", "gmea-dashboard:overview"],
        { clients: input.client, locations: input.location, services: input.service, methods: input.method });
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save rental income."); }
    finally { saving.current = false; setPending(false); }
  }
  const collected = existing?.payments.filter(payment => payment.status === "posted").reduce((sum, payment) => sum + payment.amount, 0) ?? 0;
  return { form, set, existing, collected, pending, error, submit };
}

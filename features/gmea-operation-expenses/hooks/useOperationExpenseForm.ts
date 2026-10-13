"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { saveGmeaOperationExpenseAction } from "@/actions/gmeaOperationExpenses";
import type { OperationExpense, OperationExpenseCategory } from "../types";
import { normalizeOperationExpenseInput } from "../utils/operationExpenseValidation";

export function useOperationExpenseForm(expense: OperationExpense | undefined, onClose: () => void) {
  const router = useRouter();
  const [form, setForm] = useState(() => ({ id: expense?.id ?? crypto.randomUUID(),
    date: expense?.date ?? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }),
    category: expense?.category ?? "Transportation" as OperationExpenseCategory,
    description: expense?.description ?? "", amount: expense?.amount.toString() ?? "",
    payee: expense?.payee ?? "", method: expense?.method ?? "", reference: expense?.reference ?? "", notes: expense?.notes ?? "" }));
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  function set(key: keyof typeof form, value: string) { setForm(current => ({ ...current, [key]: value })); }
  async function submit() {
    if (pending) return;
    setPending(true); setError("");
    try {
      const value = normalizeOperationExpenseInput({ ...form, amount: Number(form.amount) });
      await saveGmeaOperationExpenseAction(expense?.version ?? null, value);
      await mutate("gmea-operation-expenses:list");
      await mutate("gmea-dashboard:overview");
      await mutate("gmea-input-options");
      router.refresh(); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save operation expense."); }
    finally { setPending(false); }
  }
  return { form, set, submit, pending, error };
}

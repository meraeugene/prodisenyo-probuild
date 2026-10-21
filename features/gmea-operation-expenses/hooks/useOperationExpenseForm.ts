"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { saveGmeaOperationExpenseAction } from "@/actions/gmeaOperationExpenses";
import type { OperationExpense, OperationExpenseCategory } from "../types";
import { normalizeOperationExpenseInput } from "../utils/operationExpenseValidation";

export function useOperationExpenseForm(expense: OperationExpense | undefined, onClose: () => void, onSaved?: (expense: OperationExpense) => void | Promise<void>) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const saving = useRef(false);
  const [form, setForm] = useState(() => ({ id: expense?.id ?? crypto.randomUUID(),
    date: expense?.date ?? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }),
    category: expense?.category ?? "Transportation" as OperationExpenseCategory,
    description: expense?.description ?? "", amount: expense?.amount.toString() ?? "",
    payee: expense?.payee ?? "", method: expense?.method ?? "", reference: expense?.reference ?? "", notes: expense?.notes ?? "" }));
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  function set(key: keyof typeof form, value: string) { setForm(current => ({ ...current, [key]: value })); }
  async function submit() {
    if (saving.current) return;
    saving.current = true;
    setPending(true); setError("");
    try {
      const value = normalizeOperationExpenseInput({ ...form, amount: Number(form.amount) });
      const saved = await saveGmeaOperationExpenseAction(expense?.version ?? null, value);
      await onSaved?.(saved);
      toast.success(saved.alreadyAdded ? "This operation expense was already added." : expense ? "Operation expense updated successfully." : "Operation expense added successfully.");
      await Promise.allSettled([mutate("gmea-operation-expenses:list"), mutate("gmea-dashboard:overview"), mutate("gmea-input-options")]);
      router.refresh(); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save operation expense."); }
    finally { saving.current = false; setPending(false); }
  }
  return { form, set, submit, pending, error };
}

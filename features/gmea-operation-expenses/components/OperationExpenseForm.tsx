"use client";

import WorkspaceDialog from "@/components/workspace/WorkspaceDialog";
import GmeaSavedInput from "@/features/gmea-inputs/components/GmeaSavedInput";
import { OPERATION_EXPENSE_CATEGORIES, type OperationExpense } from "../types";
import { useOperationExpenseForm } from "../hooks/useOperationExpenseForm";
import styles from "@/components/workspace/workspace.module.css";

export default function OperationExpenseForm({ expense, readOnly = false, onClose }: {
  expense?: OperationExpense; readOnly?: boolean; onClose: () => void;
}) {
  const state = useOperationExpenseForm(expense, onClose);
  const { form, set } = state;
  return <WorkspaceDialog title={readOnly ? "Operation expense details" : expense ? "Edit operation expense" : "New operation expense"}
    description="Transportation, water, salary, and electricity spending." onClose={onClose} pending={state.pending} size="md"
    footer={<div className="space-y-3">{state.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
      <div className="flex justify-end gap-3"><button type="button" className={styles.button} disabled={state.pending} onClick={onClose}>{readOnly ? "Close" : "Cancel"}</button>
        {!readOnly && <button type="button" className={styles.primaryButton} disabled={state.pending} onClick={() => void state.submit()}>{state.pending ? "Saving…" : "Save expense"}</button>}</div></div>}>
    <fieldset disabled={readOnly || state.pending} className="grid gap-4 sm:grid-cols-2">
      <label className={styles.field}>Date *<input type="date" className={styles.control} value={form.date} onChange={event => set("date", event.target.value)} /></label>
      <label className={styles.field}>Category *<select aria-label="Category *" className={styles.control} value={form.category} onChange={event => set("category", event.target.value)}>{OPERATION_EXPENSE_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label>
      <label className={`${styles.field} sm:col-span-2`}>Description *<input maxLength={1000} className={styles.control} value={form.description} onChange={event => set("description", event.target.value)} /></label>
      <label className={styles.field}>Amount *<input type="number" min="0.01" step="0.01" className={styles.control} value={form.amount} onChange={event => set("amount", event.target.value)} /></label>
      <GmeaSavedInput field="suppliers" label="Payee / supplier" maxLength={200} value={form.payee} readOnly={readOnly} disabled={state.pending} onChange={value => set("payee", value)} />
      <GmeaSavedInput field="methods" label="Mode of payment" maxLength={100} value={form.method} readOnly={readOnly} disabled={state.pending} onChange={value => set("method", value)} />
      <label className={styles.field}>OR / reference<input maxLength={100} className={styles.control} value={form.reference} onChange={event => set("reference", event.target.value)} /></label>
      <label className={`${styles.field} sm:col-span-2`}>Notes<textarea maxLength={1000} className={`${styles.control} min-h-24 py-2`} value={form.notes} onChange={event => set("notes", event.target.value)} /></label>
    </fieldset>
  </WorkspaceDialog>;
}

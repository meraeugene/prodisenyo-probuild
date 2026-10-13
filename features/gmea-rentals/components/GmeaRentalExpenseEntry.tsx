"use client";

import type { RentalOperationsData } from "../types";
import { useRentalExpenseEntry } from "../hooks/useRentalExpenseEntry";
import GmeaSavedInput from "@/features/gmea-inputs/components/GmeaSavedInput";
import WorkspaceDialog from "@/components/workspace/WorkspaceDialog";
import styles from "@/components/workspace/workspace.module.css";

export default function GmeaRentalExpenseEntry({ operations, onClose }: {
  operations: RentalOperationsData; onClose: () => void;
}) {
  const state = useRentalExpenseEntry(operations, onClose), { form, set } = state;
  return <WorkspaceDialog title="New rental expense" description="Record the expense date, amount, and payee." onClose={onClose} pending={state.pending}
    footer={<div className="w-full space-y-3">{state.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
      <div className="flex justify-end gap-3"><button type="button" className={styles.button} disabled={state.pending} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.primaryButton} disabled={state.pending} onClick={() => void state.submit()}>{state.pending ? "Saving…" : "Add expense"}</button></div></div>}>
    <fieldset disabled={state.pending} className="grid gap-4 sm:grid-cols-2">
      <label className={styles.field}>Date *<input type="date" className={styles.control} value={form.date} onChange={event => set("date", event.target.value)} /></label>
      <label className={styles.field}>Category *<select aria-label="Category *" className={styles.control} value={form.category_id} onChange={event => set("category_id", event.target.value)}><option value="">Select category</option>{state.categories.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      <label className={`${styles.field} sm:col-span-2`}>Description *<input maxLength={1000} className={styles.control} value={form.description} onChange={event => set("description", event.target.value)} /></label>
      <label className={styles.field}>Amount *<input type="number" min="0.01" step="0.01" className={styles.control} value={form.amount} onChange={event => set("amount", event.target.value)} /></label>
      <GmeaSavedInput field="suppliers" label="Supplier / payee" initialOptions={state.payees} maxLength={200} disabled={state.pending} value={form.supplier} onChange={value => set("supplier", value)} />
      <div className="sm:col-span-2"><GmeaSavedInput field="methods" label="Payment method" value={form.method} maxLength={100} disabled={state.pending} onChange={value => set("method", value)} /></div>
      <details className="sm:col-span-2"><summary className="cursor-pointer text-sm text-teal-700">Additional details</summary><div className="mt-3 grid gap-4">
        <label className={styles.field}>OR / invoice number<input maxLength={100} className={styles.control} value={form.invoice_number} onChange={event => set("invoice_number", event.target.value)} /></label>
        <label className={styles.field}>Notes<textarea maxLength={1000} className={`${styles.control} min-h-20 py-2`} value={form.notes} onChange={event => set("notes", event.target.value)} /></label>
      </div></details>
    </fieldset>
  </WorkspaceDialog>;
}

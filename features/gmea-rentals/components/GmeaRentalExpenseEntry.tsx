"use client";
import { withGmeaEntrySession, SaveAndAddAgainButton, useGmeaEntrySession } from "@/features/gmea-forms/components/GmeaEntrySession";

import type { RentalOperationsData } from "../types";
import { useRentalExpenseEntry } from "../hooks/useRentalExpenseEntry";
import GmeaSavedInput from "@/features/gmea-inputs/components/GmeaSavedInput";
import ValidatedForm from "@/components/workspace/ValidatedForm";
import OptionalFieldIndicator from "@/components/workspace/OptionalFieldIndicator";
import { useId } from "react";
import WorkspaceDialog from "@/components/workspace/WorkspaceDialog";
import styles from "@/components/workspace/workspace.module.css";

function GmeaRentalExpenseEntry({ operations, onClose }: {
  operations: RentalOperationsData; onClose: () => void;
}) {
  const session = useGmeaEntrySession(), cancel = session?.cancel || onClose;
  const state = useRentalExpenseEntry(operations, onClose), { form, set } = state;
  const formId = useId();
  return <WorkspaceDialog title="New rental expense" description="Record the expense date, amount, and payee." onClose={cancel} pending={state.pending}
    footer={<div className="w-full space-y-3">{state.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
      <div className="flex flex-wrap justify-end gap-3"><button type="button" className={styles.button} disabled={state.pending} onClick={cancel}>Cancel</button>
        <button type="submit" form={formId} className={styles.primaryButton} disabled={state.pending}>{state.pending ? "Saving…" : "Add expense"}</button>
        <SaveAndAddAgainButton pending={state.pending} form={formId} /></div></div>}>
    <ValidatedForm id={formId} onValidSubmit={event => { session?.prepare(event); void state.submit(); }}>
      <fieldset disabled={state.pending} className="grid gap-4 sm:grid-cols-2">
        <label className={styles.field}>Date *<input required type="date" className={styles.control} value={form.date} onChange={event => set("date", event.target.value)} /></label>
        <label className={styles.field}>Category *<select required aria-label="Category *" className={styles.control} value={form.category_id} onChange={event => set("category_id", event.target.value)}><option value="">Select category</option>{state.categories.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        <label className={`${styles.field} sm:col-span-2`}>Description *<input required maxLength={1000} className={styles.control} value={form.description} onChange={event => set("description", event.target.value)} /></label>
        <label className={styles.field}>Amount *<input required type="number" max="10000000000" min="0.01" step="0.01" className={styles.control} value={form.amount} onChange={event => set("amount", event.target.value)} /></label>
        <GmeaSavedInput field="suppliers" label="Supplier / payee" initialOptions={state.payees} maxLength={200} disabled={state.pending} value={form.supplier} onChange={value => set("supplier", value)} />
        <div className="sm:col-span-2"><GmeaSavedInput field="methods" label="Payment method" value={form.method} maxLength={100} disabled={state.pending} onChange={value => set("method", value)} /></div>
        <div className="sm:col-span-2 grid gap-4">
          <label className={styles.field}><span>OR / invoice number<OptionalFieldIndicator /></span><input aria-label="OR / invoice number" maxLength={100} className={styles.control} value={form.invoice_number} onChange={event => set("invoice_number", event.target.value)} /></label>
          <label className={styles.field}><span>Notes<OptionalFieldIndicator /></span><textarea aria-label="Notes" maxLength={1000} className={`${styles.control} min-h-20 py-2`} value={form.notes} onChange={event => set("notes", event.target.value)} /></label>
        </div>
      </fieldset>
    </ValidatedForm>
  </WorkspaceDialog>;
}

export default withGmeaEntrySession(GmeaRentalExpenseEntry, []);

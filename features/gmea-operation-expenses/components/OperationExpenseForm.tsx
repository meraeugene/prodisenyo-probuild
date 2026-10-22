"use client";
import { withGmeaEntrySession, SaveAndAddAgainButton, useGmeaEntrySession } from "@/features/gmea-forms/components/GmeaEntrySession";

import ValidatedForm from "@/components/workspace/ValidatedForm";
import GmeaSubmitButton from "@/features/gmea-forms/components/GmeaSubmitButton";
import GmeaMoneyInput from "@/features/gmea-forms/components/GmeaMoneyInput";
import OptionalFieldIndicator from "@/components/workspace/OptionalFieldIndicator";
import { useId } from "react";
import WorkspaceDialog from "@/components/workspace/WorkspaceDialog";
import GmeaSavedInput from "@/features/gmea-inputs/components/GmeaSavedInput";
import { OPERATION_EXPENSE_CATEGORIES, type OperationExpense } from "../types";
import { useOperationExpenseForm } from "../hooks/useOperationExpenseForm";
import styles from "@/components/workspace/workspace.module.css";

function OperationExpenseForm({ expense, readOnly = false, onClose, onSaved }: {
  expense?: OperationExpense; readOnly?: boolean; onClose: () => void; onSaved?: (expense: OperationExpense) => void | Promise<void>;
}) {
  const session = useGmeaEntrySession(), cancel = session?.cancel || onClose;
  const state = useOperationExpenseForm(expense, onClose, onSaved);
  const { form, set } = state;
  const formId = useId();
  return <WorkspaceDialog title={readOnly ? "Operation expense details" : expense ? "Edit operation expense" : "New operation expense"}
    description="Transportation, water, salary, and electricity spending." onClose={cancel} pending={state.pending} size="md"
    footer={<div className="space-y-3">{state.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
      <div className="flex flex-wrap justify-end gap-3"><button type="button" className={styles.button} disabled={state.pending} onClick={cancel}>{readOnly ? "Close" : "Cancel"}</button>
        {!readOnly && <GmeaSubmitButton form={formId} className={styles.primaryButton} pending={state.pending}>Save expense</GmeaSubmitButton>}
        <SaveAndAddAgainButton pending={state.pending} form={formId} enabled={!readOnly} /></div></div>}>
    <ValidatedForm compactErrors id={formId} onValidSubmit={event => { if (!readOnly) { session?.prepare(event); void state.submit(); } }}>
      <fieldset disabled={readOnly || state.pending} className="grid gap-4 sm:grid-cols-2">
        <label className={styles.field}>Date *<input required type="date" className={styles.control} value={form.date} onChange={event => set("date", event.target.value)} /></label>
        <label className={styles.field}>Category *<select required aria-label="Category *" className={styles.control} value={form.category} onChange={event => set("category", event.target.value)}>{OPERATION_EXPENSE_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label>
        <label className={`${styles.field} sm:col-span-2`}>Description *<input required maxLength={1000} className={styles.control} value={form.description} onChange={event => set("description", event.target.value)} /></label>
        <label className={styles.field}>Amount *<GmeaMoneyInput required min="0.01" className={styles.control} value={form.amount} onValueChange={value => set("amount", value)} /></label>
        <GmeaSavedInput field="suppliers" label="Payee / supplier" maxLength={200} value={form.payee} readOnly={readOnly} disabled={state.pending} onChange={value => set("payee", value)} />
        <GmeaSavedInput field="methods" label="Mode of payment" maxLength={100} value={form.method} readOnly={readOnly} disabled={state.pending} onChange={value => set("method", value)} />
        <label className={styles.field}><span>OR / reference<OptionalFieldIndicator /></span><input aria-label="OR / reference" maxLength={100} className={styles.control} value={form.reference} onChange={event => set("reference", event.target.value)} /></label>
        <label className={`${styles.field} sm:col-span-2`}><span>Notes<OptionalFieldIndicator /></span><textarea aria-label="Notes" maxLength={1000} className={`${styles.control} min-h-24 py-2`} value={form.notes} onChange={event => set("notes", event.target.value)} /></label>
      </fieldset>
    </ValidatedForm>
  </WorkspaceDialog>;
}

export default withGmeaEntrySession(OperationExpenseForm, ["expense"]);

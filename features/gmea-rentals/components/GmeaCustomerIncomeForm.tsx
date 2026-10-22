"use client";
import { withGmeaEntrySession, SaveAndAddAgainButton, useGmeaEntrySession } from "@/features/gmea-forms/components/GmeaEntrySession";

import type { RentalIncomeRecord } from "../incomeTypes";
import { useCustomerIncomeForm } from "../hooks/useCustomerIncomeForm";
import { formatRentalMoney } from "../utils/rentalUi";
import GmeaSavedInput from "@/features/gmea-inputs/components/GmeaSavedInput";
import ValidatedForm from "@/components/workspace/ValidatedForm";
import GmeaSubmitButton from "@/features/gmea-forms/components/GmeaSubmitButton";
import GmeaMoneyInput from "@/features/gmea-forms/components/GmeaMoneyInput";
import OptionalFieldIndicator from "@/components/workspace/OptionalFieldIndicator";
import { useId } from "react";
import WorkspaceDialog from "@/components/workspace/WorkspaceDialog";
import styles from "@/components/workspace/workspace.module.css";
const rentalInputClass = styles.control;

function GmeaCustomerIncomeForm({ record, onClose }: { record?: RentalIncomeRecord; onClose: () => void }) {
  const session = useGmeaEntrySession(), cancel = session?.cancel || onClose;
  const state = useCustomerIncomeForm(record, onClose);
  const { form, set, existing } = state;
  const formId = useId();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const down = Number(form.down_payment || 0), full = Number(form.full_payment || 0);
  const remaining = Math.round((Number(form.total_amount || 0) - state.collected) * 100) / 100;
  const paymentError = down + full <= 0 ? "Enter at least one payment received." : Math.round((down + full) * 100) > Math.round(remaining * 100) ? "Payments cannot exceed the remaining rental balance." : undefined;
  return <WorkspaceDialog title={existing ? "Add rental payment" : "Rental income"} description="Record customer payments, company, location, and total rental amount."
    onClose={cancel} pending={state.pending} footer={<div className="w-full space-y-3">{state.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
      <div className="flex flex-wrap justify-end gap-3"><button type="button" className={styles.button} disabled={state.pending} onClick={cancel}>Cancel</button>
        <GmeaSubmitButton form={formId} className={styles.primaryButton} pending={state.pending}>Save income</GmeaSubmitButton>
        <SaveAndAddAgainButton pending={state.pending} form={formId} /></div></div>}>
    <ValidatedForm id={formId} onValidSubmit={event => { session?.prepare(event); void state.submit(); }}>
      <fieldset disabled={state.pending} className="space-y-4">
        <p className="text-sm text-slate-500">Enter at least one down payment or full payment. A date is required for each payment entered.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <GmeaSavedInput field="clients" label="Company name *" maxLength={200} value={form.client} readOnly={!!existing} disabled={state.pending} required onChange={value => set("client", value)} />
          <GmeaSavedInput field="locations" label="Location *" maxLength={200} value={form.location} readOnly={!!existing} disabled={state.pending} required onChange={value => set("location", value)} />
          <GmeaSavedInput field="services" label="Rental service" maxLength={200} value={form.service} readOnly={!!existing} disabled={state.pending} onChange={value => set("service", value)} placeholder="Backhoe rental or truck delivery" />
          <label className="block space-y-1.5 text-sm font-medium">Total amount *<GmeaMoneyInput required className={rentalInputClass} min="0.01" value={form.total_amount} readOnly={!!existing} onValueChange={value => set("total_amount", value)} /></label>
          <label className="block space-y-1.5 text-sm font-medium">Down payment<OptionalFieldIndicator /><GmeaMoneyInput aria-label="Down payment" data-validation-message={paymentError} max={Math.max(0, remaining)} className={rentalInputClass} value={form.down_payment} onValueChange={value => set("down_payment", value)} /></label>
          <label className="block space-y-1.5 text-sm font-medium">Down payment date{down > 0 ? " *" : <OptionalFieldIndicator />}<input aria-label="Down payment date" required={down > 0} max={today} className={rentalInputClass} type="date" value={form.down_payment_date} onChange={event => set("down_payment_date", event.target.value)} /></label>
          <label className="block space-y-1.5 text-sm font-medium">Full payment<OptionalFieldIndicator /><GmeaMoneyInput aria-label="Full payment" data-validation-message={paymentError} max={Math.max(0, remaining)} className={rentalInputClass} value={form.full_payment} onValueChange={value => set("full_payment", value)} /></label>
          <label className="block space-y-1.5 text-sm font-medium">Full payment date{full > 0 ? " *" : <OptionalFieldIndicator />}<input aria-label="Full payment date" required={full > 0} max={today} className={rentalInputClass} type="date" value={form.full_payment_date} onChange={event => set("full_payment_date", event.target.value)} /></label>
          <div className="sm:col-span-2"><GmeaSavedInput field="methods" label="Mode of payment *" value={form.method} maxLength={100} required disabled={state.pending} onChange={value => set("method", value)} /></div>
        </div>
        {existing && <p className="text-sm text-slate-600">Already collected: {formatRentalMoney(state.collected)}. Enter only the new payments received.</p>}
      </fieldset>
    </ValidatedForm>
  </WorkspaceDialog>;
}

export default withGmeaEntrySession(GmeaCustomerIncomeForm, ["record"]);

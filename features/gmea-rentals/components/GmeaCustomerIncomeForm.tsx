"use client";

import type { RentalIncomeRecord } from "../incomeTypes";
import { useCustomerIncomeForm } from "../hooks/useCustomerIncomeForm";
import { formatRentalMoney } from "../utils/rentalUi";
import GmeaSavedInput from "@/features/gmea-inputs/components/GmeaSavedInput";
import WorkspaceDialog from "@/components/workspace/WorkspaceDialog";
import styles from "@/components/workspace/workspace.module.css";
const rentalInputClass = styles.control;

export default function GmeaCustomerIncomeForm({ record, onClose }: { record?: RentalIncomeRecord; onClose: () => void }) {
  const state = useCustomerIncomeForm(record, onClose);
  const { form, set, existing } = state;
  return <WorkspaceDialog title={existing ? "Add rental payment" : "Rental income"} description="Record customer payments, company, location, and total rental amount."
    onClose={onClose} pending={state.pending} footer={<div className="w-full space-y-3">{state.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
      <div className="flex justify-end gap-3"><button type="button" className={styles.button} disabled={state.pending} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.primaryButton} disabled={state.pending} onClick={() => void state.submit()}>{state.pending ? "Saving…" : "Save income"}</button></div></div>}>
    <fieldset disabled={state.pending} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <GmeaSavedInput field="clients" label="Company name *" maxLength={200} value={form.client} readOnly={!!existing} disabled={state.pending} required onChange={value => set("client", value)} />
        <GmeaSavedInput field="locations" label="Location *" maxLength={200} value={form.location} readOnly={!!existing} disabled={state.pending} required onChange={value => set("location", value)} />
        <GmeaSavedInput field="services" label="Rental service" maxLength={200} value={form.service} readOnly={!!existing} disabled={state.pending} onChange={value => set("service", value)} placeholder="Backhoe rental or truck delivery" />
        <label className="block space-y-1.5 text-sm font-medium">Total amount *<input className={rentalInputClass} type="number" min="0.01" step="0.01" value={form.total_amount} readOnly={!!existing} onChange={event => set("total_amount", event.target.value)} /></label>
        <label className="block space-y-1.5 text-sm font-medium">Down payment<input className={rentalInputClass} type="number" min="0" step="0.01" value={form.down_payment} onChange={event => set("down_payment", event.target.value)} /></label>
        <label className="block space-y-1.5 text-sm font-medium">Down payment date<input className={rentalInputClass} type="date" value={form.down_payment_date} onChange={event => set("down_payment_date", event.target.value)} /></label>
        <label className="block space-y-1.5 text-sm font-medium">Full payment<input className={rentalInputClass} type="number" min="0" step="0.01" value={form.full_payment} onChange={event => set("full_payment", event.target.value)} /></label>
        <label className="block space-y-1.5 text-sm font-medium">Full payment date<input className={rentalInputClass} type="date" value={form.full_payment_date} onChange={event => set("full_payment_date", event.target.value)} /></label>
        <div className="sm:col-span-2"><GmeaSavedInput field="methods" label="Mode of payment *" value={form.method} maxLength={100} required disabled={state.pending} onChange={value => set("method", value)} /></div>
      </div>
      {existing && <p className="text-sm text-slate-600">Already collected: {formatRentalMoney(state.collected)}. Enter only the new payments received.</p>}
    </fieldset>
  </WorkspaceDialog>;
}

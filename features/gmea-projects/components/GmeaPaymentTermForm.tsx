"use client";

import { useState } from "react";
import type { ContractPaymentTermInput, ContractPaymentTerm, GmeaProject } from "../types";
import { formatMoney } from "../utils/gmeaCalculations";
import { paymentTermInput, updatePaymentTerm } from "../utils/paymentTerms";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import { MoneyField, TextField } from "./GmeaFields";

export default function GmeaPaymentTermForm({ project, term, onClose }: {
  project: GmeaProject;
  term: ContractPaymentTerm;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContractPaymentTermInput>(() => paymentTermInput(term));
  const save = useGmeaMutation(project);
  const scheduledAmount = form.value_mode === "percentage"
    ? project.contract_amount * ((form.percentage ?? 0) / 100)
    : form.amount;

  return (
    <GmeaDialog title="Edit payment schedule" description="Update this payment milestone only. The remaining schedule is balanced automatically." onClose={onClose} onSave={() => save({ kind: "contract_terms", value: { contract_amount: project.contract_amount, payment_terms: updatePaymentTerm(project.payment_terms, form, project.contract_amount) } })} saveLabel="Save payment term" compact>
      <TextField label="Payment description *" required maxLength={300} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">How is this payment calculated?</p>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5">
          <button type="button" onClick={() => setForm({ ...form, value_mode: "percentage", percentage: form.percentage || 1 })} className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition ${form.value_mode === "percentage" ? "bg-white text-teal-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Percentage</button>
          <button type="button" onClick={() => setForm({ ...form, value_mode: "fixed", percentage: null, amount: scheduledAmount })} className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition ${form.value_mode === "fixed" ? "bg-white text-teal-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Fixed amount</button>
        </div>
      </div>
      {form.value_mode === "percentage" ? (
        <TextField label="Percentage of contract *" type="number" min="0.01" max="100" step="0.01" required value={form.percentage ?? 0} onChange={(event) => setForm({ ...form, percentage: Number(event.target.value) })} />
      ) : (
        <MoneyField label="Scheduled amount (PHP) *" required value={form.amount} onValueChange={(amount) => setForm({ ...form, amount })} />
      )}
      <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">
        <p className="text-xs font-medium text-teal-700">Scheduled payment</p>
        <p className="mt-1 text-xl font-semibold text-teal-950">{formatMoney(scheduledAmount)}</p>
      </div>
      <TextField label="Notes" maxLength={1000} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
    </GmeaDialog>
  );
}

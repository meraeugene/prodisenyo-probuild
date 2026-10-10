"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { ContractPaymentTerm, ContractPaymentTermInput } from "../types";
import { PAYMENT_TERM_TEMPLATES, inputClass, secondaryClass } from "../utils/gmeaConstants";
import { formatMoney, money, paymentTermSummary, sumMoney } from "../utils/gmeaCalculations";
import { buildPaymentTerms, recalculatePercentageTerms } from "../utils/paymentTerms";
import { collectedDates, formatSummaryDate, summaryPercentage } from "../utils/projectSummaryColumns";
import { Field, MoneyField, TextField } from "./GmeaFields";

export default function GmeaPaymentTermsEditor({ contractAmount, terms, protectedAmounts = {}, protectedTermIds = [], recordedTerms = [], onRecord, onChange }: {
  contractAmount: number; terms: ContractPaymentTermInput[];
  protectedAmounts?: Record<string, number>; protectedTermIds?: string[]; recordedTerms?: ContractPaymentTerm[];
  onChange: (terms: ContractPaymentTermInput[]) => void;
  onRecord?: (term: ContractPaymentTerm) => void;
}) {
  const scheduled = sumMoney(terms.map((term) => term.amount));
  const difference = money(contractAmount - scheduled);
  const protectedTerms = new Set(protectedTermIds);
  function update(index: number, patch: Partial<ContractPaymentTermInput>) {
    onChange(recalculatePercentageTerms(terms.map((term, row) => row === index ? { ...term, ...patch } : term), contractAmount));
  }
  function move(index: number, offset: number) {
    const next = [...terms], target = index + offset;
    if (target < 0 || target >= terms.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <Field label="Payment schedule template"><select className={inputClass} disabled={protectedTermIds.length > 0} defaultValue=""
        title={protectedTermIds.length ? "Keep schedules with payment history." : undefined}
        onChange={(event) => { if (event.target.value) onChange(buildPaymentTerms(event.target.value, contractAmount)); event.target.value = ""; }}>
        <option value="">Select a template…</option>
        {PAYMENT_TERM_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
        <option value="custom">Custom schedule</option>
      </select></Field>
      <button type="button" className={secondaryClass} disabled={terms.length >= 30} onClick={() => onChange([...terms, {
        id: crypto.randomUUID(), description: terms.length ? "Completion" : "Down payment", value_mode: "fixed",
        percentage: null, display_percentage: null, amount: Math.max(0, difference), notes: "",
      }])}>Add completion milestone</button>
    </div>
    <p className="text-sm text-slate-500">The first row is the down payment. Following rows are completion milestones. Use a fixed amount to retain the entered peso value independently of its percentage label.</p>
    <div className="overflow-x-auto rounded-lg border border-slate-200" tabIndex={0} role="region" aria-label="Payment schedule inputs">
      <table className="w-full min-w-[1040px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600"><tr>
          {["Payment stage / description", "%", "Amount", "Not Yet", "Paid", "Collected date", "Actions"].map(label => <th key={label} scope="col" className="p-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">{terms.map((term, index) => {
          const recorded = recordedTerms.find(item => item.id === term.id);
          const received = recorded ? paymentTermSummary(recorded).received : protectedAmounts[term.id] ?? 0;
          const dates = recorded ? collectedDates(recorded) : [];
          const percentage = summaryPercentage(term);
          return <tr key={term.id} className="align-top">
            <td className="min-w-[260px] space-y-3 p-3">
              <p className="font-semibold text-teal-800">{index === 0 ? "Down Payment" : "Completion"}</p>
              <TextField label={`Milestone ${index + 1} description *`} required maxLength={300} value={term.description} onChange={event => update(index, { description: event.target.value })} />
              <TextField label={`Milestone ${index + 1} notes`} maxLength={1000} value={term.notes} onChange={event => update(index, { notes: event.target.value })} />
            </td>
            <td className="min-w-[120px] p-3"><TextField label={`Milestone ${index + 1} percentage`} type="number" min={term.value_mode === "percentage" ? "0.01" : "0"} max="100" step="0.01" required={term.value_mode === "percentage"} value={percentage ?? ""} onChange={event => {
              const value = event.target.value === "" ? null : Number(event.target.value);
              update(index, term.value_mode === "percentage" ? { percentage: value } : { display_percentage: value });
            }} /></td>
            <td className="min-w-[190px] space-y-3 p-3">
              <Field label={`Milestone ${index + 1} amount basis`}><select className={inputClass} value={term.value_mode} onChange={event => {
                const mode = event.target.value as "fixed" | "percentage";
                update(index, { value_mode: mode, percentage: mode === "percentage" ? percentage ?? 0 : null, display_percentage: mode === "fixed" ? percentage : undefined });
              }}><option value="fixed">Entered amount</option><option value="percentage">Calculate from %</option></select></Field>
              {term.value_mode === "fixed" ? <MoneyField label={`Milestone ${index + 1} amount (PHP) *`} required value={term.amount} onValueChange={amount => update(index, { amount })} /> : <p className="py-3 font-semibold tabular-nums">{formatMoney(term.amount)}</p>}
            </td>
            <td className="whitespace-nowrap p-3 tabular-nums">{formatMoney(Math.max(0, money(term.amount - received)))}</td>
            <td className="whitespace-nowrap p-3 tabular-nums">{formatMoney(received)}
              {recorded && onRecord && <button type="button" disabled={paymentTermSummary(recorded).balance <= 0} className={secondaryClass + " mt-3 block text-teal-800"} onClick={() => onRecord(recorded)}>Record payment</button>}
            </td>
            <td className="p-3">{dates.length ? dates.map(date => <p key={date ?? "unknown"} className="whitespace-nowrap">{formatSummaryDate(date)}</p>) : "—"}</td>
            <td className="p-3"><div className="flex gap-1">
              <button type="button" aria-label={`Move milestone ${index + 1} up`} className={secondaryClass} disabled={!index} onClick={() => move(index, -1)}><ArrowUp size={14} /></button>
              <button type="button" aria-label={`Move milestone ${index + 1} down`} className={secondaryClass} disabled={index === terms.length - 1} onClick={() => move(index, 1)}><ArrowDown size={14} /></button>
              <button type="button" aria-label={`Remove milestone ${index + 1}`} className={secondaryClass} disabled={protectedTerms.has(term.id)} onClick={() => onChange(terms.filter((_, row) => row !== index))}><Trash2 size={14} /></button>
            </div></td>
          </tr>;
        })}</tbody>
      </table>
      {!terms.length && <p className="p-6 text-center text-slate-500">Select a template or add a payment milestone.</p>}
    </div>
    {!!recordedTerms.length && <p className="text-sm text-slate-500">Paid amounts and collected dates come from payment history. Use Record payment in the project payment schedule to add a collection.</p>}
    <p className={`rounded-lg p-4 text-sm ${difference === 0 ? "bg-teal-50 text-teal-900" : "bg-amber-50 text-amber-900"}`}>
      Scheduled: <strong>{formatMoney(scheduled)}</strong> · Contract: <strong>{formatMoney(contractAmount)}</strong>
      {difference !== 0 && <> · Difference: <strong>{formatMoney(difference)}</strong></>}
    </p>
  </div>;
}

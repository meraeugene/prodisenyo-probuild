"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { ContractPaymentTermInput } from "../types";
import { PAYMENT_TERM_TEMPLATES, inputClass, secondaryClass } from "../utils/gmeaConstants";
import { formatMoney, sumMoney } from "../utils/gmeaCalculations";
import {
  buildPaymentTerms,
  recalculatePercentageTerms,
} from "../utils/paymentTerms";
import { Field, MoneyField, TextField } from "./GmeaFields";

export default function GmeaPaymentTermsEditor({
  contractAmount,
  terms,
  protectedAmounts = {},
  protectedTermIds = [],
  onChange,
}: {
  contractAmount: number;
  terms: ContractPaymentTermInput[];
  protectedAmounts?: Record<string, number>;
  protectedTermIds?: string[];
  onChange: (terms: ContractPaymentTermInput[]) => void;
}) {
  const scheduled = sumMoney(terms.map((term) => term.amount));
  const difference = Math.round((contractAmount - scheduled) * 100) / 100;
  const protectedTerms = new Set(protectedTermIds);

  function update(index: number, patch: Partial<ContractPaymentTermInput>) {
    const nextTerms = terms.map((term, rowIndex) => {
        if (rowIndex !== index) return term;
        const next = { ...term, ...patch };
        if (next.value_mode === "percentage")
          next.amount = Math.round(
            contractAmount * (next.percentage ?? 0),
          ) / 100;
        else next.percentage = null;
        return next;
      });
    onChange(recalculatePercentageTerms(nextTerms, contractAmount));
  }

  function move(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= terms.length) return;
    const next = [...terms];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Field label="Starting template">
          <select
            className={inputClass}
            disabled={protectedTermIds.length > 0}
            title={protectedTermIds.length ? "Schedules with receipt history cannot be replaced by a template." : undefined}
            defaultValue=""
            onChange={(event) => {
              if (!event.target.value) return;
              onChange(buildPaymentTerms(event.target.value, contractAmount));
              event.target.value = "";
            }}
          >
            <option value="">Select a template…</option>
            {PAYMENT_TERM_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
            <option value="custom">Custom blank schedule</option>
          </select>
        </Field>
        <button
          type="button"
          className={secondaryClass}
          disabled={terms.length >= 30}
          onClick={() =>
            onChange([
              ...terms,
              {
                id: crypto.randomUUID(),
                description: "",
                value_mode: "fixed",
                percentage: null,
                amount: Math.max(0, difference),
                notes: "",
              },
            ])
          }
        >
          Add term
        </button>
      </div>

      {terms.map((term, index) => (
        <div key={term.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_-22px_rgba(15,23,42,.35)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">Payment term {index + 1}</p>
              <p className="mt-0.5 text-xs text-slate-400">Set the milestone and scheduled value.</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Move payment term up" className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35" disabled={!index} onClick={() => move(index, -1)}><ArrowUp size={15} aria-hidden="true" /></button>
              <button type="button" aria-label="Move payment term down" className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35" disabled={index === terms.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} aria-hidden="true" /></button>
              <button
                type="button"
                aria-label="Remove payment term"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-rose-100 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-35"
                disabled={protectedTerms.has(term.id)}
                onClick={() => onChange(terms.filter((_, rowIndex) => rowIndex !== index))}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(260px,1.7fr)_170px_190px]">
            <TextField
              label="Description *"
              required
              maxLength={300}
              value={term.description}
              onChange={(event) => update(index, { description: event.target.value })}
            />
            <Field label="Value type">
              <select
                className={inputClass}
                value={term.value_mode}
                onChange={(event) => update(index, {
                  value_mode: event.target.value as "percentage" | "fixed",
                  percentage: event.target.value === "percentage" ? 0 : null,
                })}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </Field>
            {term.value_mode === "percentage" ? (
              <TextField
                label="Percentage *"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                required
                value={term.percentage ?? 0}
                onChange={(event) => update(index, { percentage: Number(event.target.value) })}
              />
            ) : (
              <MoneyField
                label="Amount (PHP) *"
                required
                value={term.amount}
                onValueChange={(amount) => update(index, { amount })}
              />
            )}
          </div>

          <div className="mt-4 grid items-end gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <TextField
              label="Notes (optional)"
              maxLength={1000}
              placeholder="Add a short note"
              value={term.notes}
              onChange={(event) => update(index, { notes: event.target.value })}
            />
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Scheduled amount</p>
              <div className="flex min-h-[42px] items-center rounded-xl border border-teal-100 bg-teal-50/70 px-3 text-sm font-semibold text-teal-900 tabular-nums">
                {formatMoney(term.amount)}
                {protectedAmounts[term.id] > 0 && <span className="ml-auto text-xs font-medium text-teal-700">Received {formatMoney(protectedAmounts[term.id])}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}

      {!terms.length && (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Select a template or add the first payment term.
        </p>
      )}
      <div className={`rounded-xl p-4 text-sm ${difference === 0 ? "bg-teal-50 text-teal-900" : "bg-amber-50 text-amber-900"}`}>
        Scheduled: <strong>{formatMoney(scheduled)}</strong> · Contract: <strong>{formatMoney(contractAmount)}</strong>
        {difference !== 0 && <> · Difference: <strong>{formatMoney(difference)}</strong></>}
      </div>
    </div>
  );
}

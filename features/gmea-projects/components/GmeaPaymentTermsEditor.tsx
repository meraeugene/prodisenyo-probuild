"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
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
          <Plus size={16} /> Add term
        </button>
      </div>

      {terms.map((term, index) => (
        <div key={term.id} className="space-y-4 rounded-xl border border-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <TextField
                label={`Payment term ${index + 1} *`}
                required
                maxLength={300}
                value={term.description}
                onChange={(event) => update(index, { description: event.target.value })}
              />
            </div>
            <div className="flex pt-7">
              <button type="button" aria-label="Move term up" className={secondaryClass} disabled={!index} onClick={() => move(index, -1)}><ArrowUp size={15} /></button>
              <button type="button" aria-label="Move term down" className={secondaryClass} disabled={index === terms.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} /></button>
              <button
                type="button"
                aria-label="Remove payment term"
                className={secondaryClass + " text-rose-700"}
                disabled={protectedTerms.has(term.id)}
                title={protectedTerms.has(term.id) ? "Terms with receipt history cannot be removed." : undefined}
                onClick={() => onChange(terms.filter((_, rowIndex) => rowIndex !== index))}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
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
            <div className="rounded-xl bg-cyan-50 px-4 py-3 text-sm text-cyan-950">
              <p className="text-xs font-medium text-cyan-700">Scheduled amount</p>
              <p className="mt-1 font-semibold">{formatMoney(term.amount)}</p>
              {protectedAmounts[term.id] > 0 && (
                <p className="mt-1 text-xs">Received: {formatMoney(protectedAmounts[term.id])}</p>
              )}
            </div>
          </div>
          <TextField
            label="Contract notes"
            maxLength={1000}
            value={term.notes}
            onChange={(event) => update(index, { notes: event.target.value })}
          />
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

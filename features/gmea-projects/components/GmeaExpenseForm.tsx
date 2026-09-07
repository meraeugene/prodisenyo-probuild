"use client";
import { useState } from "react";
import type { Expense, GmeaProject } from "../types";
import { EXPENSE_CATEGORIES, inputClass, today } from "../utils/gmeaConstants";
import { formatMoney, vatBreakdown } from "../utils/gmeaCalculations";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import { Field, TextField, VatFields } from "./GmeaFields";

export default function GmeaExpenseForm({
  project,
  expense,
  readOnly = false,
  onClose,
}: {
  project: GmeaProject;
  expense?: Expense;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Expense>(
    () =>
      expense ?? {
        id: crypto.randomUUID(),
        date: today(),
        description: "",
        category: "Materials",
        supplier: "",
        invoice_number: "",
        invoice_name: "",
        amount: 0,
        vat_mode: "off",
        vat_rate: 0,
        method: "",
        notes: "",
      },
  );
  const save = useGmeaMutation(project);
  function update<K extends keyof Expense>(key: K, value: Expense[K]) {
    setForm({ ...form, [key]: value });
  }
  let totals: ReturnType<typeof vatBreakdown> | null = null;
  try {
    totals = vatBreakdown(form.amount, form.vat_mode, form.vat_rate);
  } catch {}
  return (
    <GmeaDialog
      title={
        readOnly ? "Expense details" : expense ? "Edit expense" : "New expense"
      }
      onClose={onClose}
      onSave={
        readOnly ? undefined : () => save({ kind: "expense", value: form })
      }
    >
      <fieldset disabled={readOnly} className="min-w-0 space-y-5">
        <TextField
          label="Description *"
          required
          maxLength={2000}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Expense date *"
            type="date"
            required
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
          />
          <Field label="Category">
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <TextField
            label="Supplier / vendor"
            maxLength={200}
            value={form.supplier}
            onChange={(e) => update("supplier", e.target.value)}
          />
          <TextField
            label="Payment method *"
            placeholder="Cash, cheque, bank transfer…"
            required
            maxLength={100}
            value={form.method}
            onChange={(e) => update("method", e.target.value)}
          />
          <TextField
            label="OR / invoice number"
            maxLength={100}
            value={form.invoice_number}
            onChange={(e) => update("invoice_number", e.target.value)}
          />
          <TextField
            label="Invoice issued to"
            maxLength={200}
            value={form.invoice_name}
            onChange={(e) => update("invoice_name", e.target.value)}
          />
          <TextField
            label="Amount (PHP) *"
            required
            type="number"
            min="0.01"
            max="10000000000"
            step="0.01"
            value={form.amount || ""}
            onChange={(e) => update("amount", Number(e.target.value))}
          />
        </div>
        <VatFields
          mode={form.vat_mode}
          rate={form.vat_rate}
          onChange={(vat_mode, vat_rate) =>
            setForm({ ...form, vat_mode, vat_rate })
          }
        />
        <div
          aria-live="polite"
          className="grid gap-3 rounded-xl bg-emerald-50 p-4 text-sm sm:grid-cols-3"
        >
          <p>
            VAT-exclusive: <strong>{formatMoney(totals?.base ?? null)}</strong>
          </p>
          <p>
            Input VAT: <strong>{formatMoney(totals?.vat ?? null)}</strong>
          </p>
          <p>
            Total expense: <strong>{formatMoney(totals?.gross ?? null)}</strong>
          </p>
        </div>
        <Field label="Notes">
          <textarea
            className={inputClass}
            rows={3}
            maxLength={2000}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </Field>
      </fieldset>
    </GmeaDialog>
  );
}

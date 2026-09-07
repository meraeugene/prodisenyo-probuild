"use client";
import { useState } from "react";
import type { Expense, GmeaExpenseOptions, GmeaProject } from "../types";
import { EXPENSE_CATEGORIES, inputClass, today } from "../utils/gmeaConstants";
import { formatMoney, vatBreakdown } from "../utils/gmeaCalculations";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import {
  Field,
  MoneyField,
  SearchableSelect,
  TextField,
  VatFields,
} from "./GmeaFields";

export default function GmeaExpenseForm({
  project,
  expenseOptions,
  expense,
  readOnly = false,
  onClose,
}: {
  project: GmeaProject;
  expenseOptions: GmeaExpenseOptions;
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
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
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
              <SearchableSelect
                label="Supplier / vendor"
                options={expenseOptions.suppliers}
                maxLength={200}
                value={form.supplier}
                onChange={(value) => update("supplier", value)}
              />
              <SearchableSelect
                label="Payment method *"
                options={expenseOptions.methods}
                placeholder="Search or enter payment method"
                required
                maxLength={100}
                value={form.method}
                onChange={(value) => update("method", value)}
              />
              <TextField
                label="OR / invoice number"
                maxLength={100}
                value={form.invoice_number}
                onChange={(e) => update("invoice_number", e.target.value)}
              />
              <SearchableSelect
                label="Invoice issued to"
                options={expenseOptions.invoiceNames}
                maxLength={200}
                value={form.invoice_name}
                onChange={(value) => update("invoice_name", value)}
              />
              <MoneyField
                label="Amount (PHP) *"
                required
                value={form.amount}
                onValueChange={(value) => update("amount", value)}
              />
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
          </div>
          <aside className="h-fit space-y-4 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
            <h3 className="font-semibold text-slate-900">VAT calculation</h3>
            <VatFields
              mode={form.vat_mode}
              rate={form.vat_rate}
              onChange={(vat_mode, vat_rate) =>
                setForm({ ...form, vat_mode, vat_rate })
              }
            />
            <div aria-live="polite" className="space-y-3 text-sm">
              <p className="flex justify-between gap-3">
                <span>VAT-exclusive</span>
                <strong>{formatMoney(totals?.base ?? null)}</strong>
              </p>
              <p className="flex justify-between gap-3">
                <span>Input VAT</span>
                <strong>{formatMoney(totals?.vat ?? null)}</strong>
              </p>
              <p className="flex justify-between gap-3 border-t border-cyan-200 pt-3">
                <span>Total expense</span>
                <strong>{formatMoney(totals?.gross ?? null)}</strong>
              </p>
            </div>
          </aside>
        </div>
      </fieldset>
    </GmeaDialog>
  );
}

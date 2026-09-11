"use client";

import { useId, useState } from "react";
import {
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Package,
  Percent,
  PhilippinePeso,
  RotateCcw,
  UserRound,
} from "lucide-react";
import type { Expense, GmeaExpenseOptions, GmeaProject } from "../types";
import { EXPENSE_CATEGORIES, inputClass, today } from "../utils/gmeaConstants";
import { formatMoney, vatBreakdown } from "../utils/gmeaCalculations";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import GmeaExpenseItemsField from "./GmeaExpenseItemsField";
import { MoneyField, SearchableSelect, TextField, VatFields } from "./GmeaFields";

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
  const categoryId = useId();
  const notesId = useId();
  const [form, setForm] = useState<Expense>(() =>
    expense
      ? { ...expense, notes: expense.notes ?? "" }
      : {
          id: crypto.randomUUID(),
          date: today(),
          description: "",
          category: "Materials",
          supplier: "",
          invoice_number: "",
          invoice_name: "",
          amount: 0,
          refunded_amount: 0,
          vat_mode: "inclusive",
          vat_rate: 12,
          method: "",
          notes: "",
        },
  );
  const save = useGmeaMutation(project);

  function update<K extends keyof Expense>(key: K, value: Expense[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  let totals: ReturnType<typeof vatBreakdown> | null = null;
  try {
    totals = vatBreakdown(form.amount, form.vat_mode, form.vat_rate);
  } catch {}

  const amountLabel = form.vat_mode === "inclusive"
    ? "Amount (VAT-inclusive)"
    : form.vat_mode === "exclusive"
      ? "Amount (VAT-exclusive)"
      : "Amount";

  return (
    <GmeaDialog
      title="Expense details"
      description="Fill in the information below."
      onClose={onClose}
      wide
      onSave={readOnly ? undefined : () => save({ kind: "expense", value: form })}
      saveLabel={expense ? "Save changes" : "Add expense"}
    >
      <fieldset disabled={readOnly} className="min-w-0">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="grid content-start gap-x-5 gap-y-5 sm:grid-cols-2">
            <TextField label="Expense date *" type="date" required value={form.date} leadingIcon={<CalendarDays size={18} />} onChange={(event) => update("date", event.target.value)} />

            <GmeaExpenseItemsField value={form.description} onChange={(value) => update("description", value)} />

            <div className="space-y-1.5 text-sm font-medium text-slate-700">
              <label htmlFor={categoryId} className="block">Category</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-px left-px grid w-12 place-items-center rounded-l-[11px] border-r border-slate-100 bg-slate-50 text-slate-500" aria-hidden="true"><Package size={18} /></span>
                <select id={categoryId} className={inputClass + " pl-14"} value={form.category} onChange={(event) => update("category", event.target.value)}>
                  {EXPENSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
            </div>

            <SearchableSelect label="Supplier / vendor" options={expenseOptions.suppliers} maxLength={200} value={form.supplier} leadingIcon={<Building2 size={18} />} onChange={(value) => update("supplier", value)} />
            <MoneyField label="Amount (PHP) *" required value={form.amount} leadingIcon={<PhilippinePeso size={18} />} onValueChange={(value) => update("amount", value)} />
            <SearchableSelect label="Payment method *" options={expenseOptions.methods} placeholder="Type or choose a payment method" required maxLength={100} value={form.method} leadingIcon={<CreditCard size={18} />} onChange={(value) => update("method", value)} />
            <TextField label="OR / invoice number" maxLength={100} value={form.invoice_number} leadingIcon={<FileText size={18} />} onChange={(event) => update("invoice_number", event.target.value)} />
            <SearchableSelect label="Invoice issued to" options={expenseOptions.invoiceNames} maxLength={200} value={form.invoice_name} leadingIcon={<UserRound size={18} />} onChange={(value) => update("invoice_name", value)} />
            <MoneyField label="Refunded Sir Edward (PHP)" value={form.refunded_amount} leadingIcon={<RotateCcw size={18} />} onValueChange={(value) => update("refunded_amount", value)} />
          </section>

          <div className="space-y-4">
            <aside className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
              <div className="mb-5 flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-700"><Percent size={20} aria-hidden="true" /></span>
                <div><h3 className="text-lg font-semibold text-slate-950">VAT calculation</h3><p className="mt-1 text-xs leading-5 text-slate-500">Automatically calculated from the amount and VAT treatment.</p></div>
              </div>
              <VatFields mode={form.vat_mode} onChange={(vat_mode, vat_rate) => setForm((current) => ({ ...current, vat_mode, vat_rate }))} />
              <div className="mt-4 rounded-xl border border-slate-200/80 bg-white p-4 text-sm">
                <p className="flex justify-between gap-3 text-slate-500"><span>{amountLabel}</span><strong className="text-slate-900">{formatMoney((form.vat_mode === "exclusive" ? totals?.base : totals?.gross) ?? null)}</strong></p>
                <p className="mt-4 flex justify-between gap-3 text-slate-500"><span>VAT amount ({form.vat_rate}%)</span><strong className="text-slate-900">{formatMoney(totals?.vat ?? null)}</strong></p>
                <p className="mt-4 flex justify-between gap-3 text-slate-500"><span>VAT-excluded amount</span><strong className="text-slate-900">{formatMoney(totals?.base ?? null)}</strong></p>
                <p className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-base font-semibold text-slate-950"><span>Total expense</span><strong>{formatMoney(totals?.gross ?? null)}</strong></p>
              </div>
            </aside>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <label htmlFor={notesId} className="flex items-center gap-2 text-sm font-semibold text-slate-800"><FileText size={17} aria-hidden="true" /> Notes <span className="font-normal text-slate-400">(optional)</span></label>
              <textarea id={notesId} className={inputClass + " mt-3 min-h-24 resize-y"} maxLength={1000} placeholder="Add a note about this expense..." value={form.notes} onChange={(event) => update("notes", event.target.value)} />
            </section>
          </div>
        </div>
      </fieldset>
    </GmeaDialog>
  );
}

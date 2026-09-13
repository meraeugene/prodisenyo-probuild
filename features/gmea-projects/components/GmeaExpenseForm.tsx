"use client";

import { useId, useState } from "react";
import {
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Package,
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
import { MoneyField, SearchableSelect, TextField } from "./GmeaFields";

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
        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label="Expense date *" type="date" required value={form.date} leadingIcon={<CalendarDays size={18} />} onChange={(event) => update("date", event.target.value)} />

            <div className="sm:col-span-1 lg:col-span-2">
              <GmeaExpenseItemsField value={form.description} onChange={(value) => update("description", value)} />
            </div>

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

            <div className="space-y-1.5 text-sm font-medium text-slate-700">
              <label htmlFor={`${categoryId}-vat`} className="block">VAT treatment</label>
              <select
                id={`${categoryId}-vat`}
                className={inputClass}
                value={form.vat_mode}
                onChange={(event) => {
                  const vat_mode = event.target.value as Expense["vat_mode"];
                  setForm((current) => ({ ...current, vat_mode, vat_rate: vat_mode === "off" ? 0 : 12 }));
                }}
              >
                <option value="off">No VAT</option>
                <option value="inclusive">12% VAT included</option>
                <option value="exclusive">Add 12% VAT</option>
              </select>
            </div>

            <div className="space-y-1.5 text-sm font-medium text-slate-700">
              <label htmlFor={notesId} className="block">Notes <span className="font-normal text-slate-400">(optional)</span></label>
              <input id={notesId} className={inputClass} maxLength={1000} placeholder="Add a short note" value={form.notes} onChange={(event) => update("notes", event.target.value)} />
            </div>

            <section className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-4">
              <div><p className="text-[11px] text-slate-500">{amountLabel}</p><p className="mt-1 text-sm font-semibold text-slate-900">{formatMoney((form.vat_mode === "exclusive" ? totals?.base : totals?.gross) ?? null)}</p></div>
              <div><p className="text-[11px] text-slate-500">VAT ({form.vat_rate}%)</p><p className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(totals?.vat ?? null)}</p></div>
              <div><p className="text-[11px] text-slate-500">VAT excluded</p><p className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(totals?.base ?? null)}</p></div>
              <div><p className="text-[11px] font-medium text-slate-600">Total expense</p><p className="mt-1 text-base font-bold text-slate-950">{formatMoney(totals?.gross ?? null)}</p></div>
            </section>
        </div>
      </fieldset>
    </GmeaDialog>
  );
}

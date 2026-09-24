"use client";
import { useState } from "react";
import type { ReactNode } from "react";
import type {
  GmeaRental,
  RentalEquipment,
  RentalExpense,
  RentalExpenseCategory,
  RentalVatMode,
} from "../types";
import { formatRentalMoney, rentalInputClass } from "../utils/rentalUi";
import { rentalVatBreakdown } from "../utils/expenseCalculations";
import { useGmeaRentalOperationsMutation } from "../hooks/useGmeaRentalOperationsMutation";
import GmeaRentalsDialog from "./GmeaRentalsDialog";

type Scope = "rental" | "equipment" | "general";
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

export default function GmeaRentalExpenseForm({
  rental,
  equipment,
  categories,
  expense,
  onClose,
}: {
  rental: GmeaRental;
  equipment: RentalEquipment[];
  categories: RentalExpenseCategory[];
  expense?: RentalExpense;
  onClose: () => void;
}) {
  const initialScope: Scope = expense?.rental_id
    ? "rental"
    : expense?.equipment_id
      ? "equipment"
      : "general";
  const [scope, setScope] = useState<Scope>(initialScope);
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState({
    id: expense?.id ?? crypto.randomUUID(),
    equipment_id: expense?.equipment_id ?? "",
    category_id: expense?.category_id ?? categories[0]?.id ?? "",
    date: expense?.date ?? today(),
    description: expense?.description ?? "",
    supplier: expense?.supplier ?? "",
    method: expense?.method ?? "",
    invoice_number: expense?.invoice_number ?? "",
    amount: expense?.amount.toString() ?? "",
    refunded_amount: expense?.refunded_amount.toString() ?? "0",
    vat_mode: expense?.vat_mode ?? ("off" as RentalVatMode),
    notes: expense?.notes ?? "",
    version: expense?.version ?? 1,
  });
  const { saveExpense, pending, error } =
    useGmeaRentalOperationsMutation(rental);
  const rentalEquipment = equipment.filter((item) =>
    rental.items.some((row) => row.equipment_id === item.id),
  );
  const choices = scope === "rental" ? rentalEquipment : equipment;
  const vatRate = form.vat_mode === "off" ? 0 : 12;
  let totals = { base: 0, vat: 0, gross: 0 };
  try {
    totals = rentalVatBreakdown(
      Number(form.amount || 0),
      form.vat_mode,
      vatRate,
    );
  } catch {}
  const set = (key: keyof typeof form, value: string | number) =>
    setForm((current) => ({ ...current, [key]: value }));
  function changeScope(next: Scope) {
    setScope(next);
    setForm((current) => ({ ...current, equipment_id: "" }));
  }
  function submit() {
    if (scope === "equipment" && !form.equipment_id) {
      setLocalError("Select equipment for an equipment-only expense.");
      return;
    }
    setLocalError("");
    void saveExpense(expense ?? null, {
      kind: expense ? "update" : "create",
      value: {
        ...form,
        rental_id: scope === "rental" ? rental.id : null,
        equipment_id: scope === "general" ? null : form.equipment_id || null,
        amount: Number(form.amount),
        refunded_amount: Number(form.refunded_amount),
        vat_rate: vatRate,
      },
    })
      .then(onClose)
      .catch(() => undefined);
  }
  return (
    <GmeaRentalsDialog
      title={expense ? "Edit rental expense" : "New rental expense"}
      description="Record Rentals operational spending and VAT treatment."
      onClose={onClose}
      onSave={submit}
      pending={pending}
      error={localError || error}
      saveLabel={expense ? "Save changes" : "Add expense"}
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Expense scope *">
          <select
            value={scope}
            onChange={(event) => changeScope(event.target.value as Scope)}
            className={rentalInputClass}
          >
            <option value="rental">This rental</option>
            <option value="equipment">Equipment only</option>
            <option value="general">General Rentals operations</option>
          </select>
        </Field>
        {scope !== "general" && (
          <Field
            label={
              scope === "equipment"
                ? "Related equipment *"
                : "Related equipment"
            }
          >
            <select
              value={form.equipment_id}
              onChange={(event) => set("equipment_id", event.target.value)}
              className={rentalInputClass}
            >
              <option value="">
                {scope === "rental"
                  ? "No specific equipment"
                  : "Select equipment"}
              </option>
              {choices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Date *">
          <input
            type="date"
            value={form.date}
            onChange={(event) => set("date", event.target.value)}
            className={rentalInputClass}
          />
        </Field>
        <Field label="Category *">
          <select
            value={form.category_id}
            onChange={(event) => set("category_id", event.target.value)}
            className={rentalInputClass}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description *">
            <input
              maxLength={1000}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              className={rentalInputClass}
            />
          </Field>
        </div>
        <Field label="Supplier / payee">
          <input
            maxLength={200}
            value={form.supplier}
            onChange={(event) => set("supplier", event.target.value)}
            className={rentalInputClass}
          />
        </Field>
        <Field label="Payment method">
          <input
            maxLength={100}
            value={form.method}
            onChange={(event) => set("method", event.target.value)}
            className={rentalInputClass}
          />
        </Field>
        <Field label="OR / invoice number">
          <input
            maxLength={100}
            value={form.invoice_number}
            onChange={(event) => set("invoice_number", event.target.value)}
            className={rentalInputClass}
          />
        </Field>
        <Field label="VAT treatment">
          <select
            value={form.vat_mode}
            onChange={(event) =>
              set("vat_mode", event.target.value as RentalVatMode)
            }
            className={rentalInputClass}
          >
            <option value="off">No VAT</option>
            <option value="inclusive">VAT included</option>
            <option value="exclusive">Add 12%</option>
          </select>
        </Field>
        <Field label="Amount *">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(event) => set("amount", event.target.value)}
            className={rentalInputClass}
          />
        </Field>
        <Field label="Refunded amount">
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.refunded_amount}
            onChange={(event) => set("refunded_amount", event.target.value)}
            className={rentalInputClass}
          />
        </Field>
        <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 text-sm sm:col-span-2 lg:col-span-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <p>
              <span className="block text-xs text-slate-500">Base</span>
              <strong>{formatRentalMoney(totals.base)}</strong>
            </p>
            <p>
              <span className="block text-xs text-slate-500">Input VAT</span>
              <strong>{formatRentalMoney(totals.vat)}</strong>
            </p>
            <p>
              <span className="block text-xs text-slate-500">Total</span>
              <strong>{formatRentalMoney(totals.gross)}</strong>
            </p>
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Notes">
            <textarea
              maxLength={1000}
              value={form.notes}
              onChange={(event) => set("notes", event.target.value)}
              className={rentalInputClass + " min-h-20 py-3"}
            />
          </Field>
        </div>
      </div>
    </GmeaRentalsDialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

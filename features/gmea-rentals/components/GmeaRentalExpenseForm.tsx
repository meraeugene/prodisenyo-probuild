"use client";
import type { ReactNode } from "react";
import type {
  GmeaRental,
  RentalEquipment,
  RentalExpense,
  RentalExpenseCategory,
} from "../types";
import { rentalInputClass } from "../utils/rentalUi";
import type { RentalWeekMetadata } from "../utils/rentalReportingWeeks";
import GmeaRentalWeekFields from "./GmeaRentalWeekFields";
import GmeaRentalExpenseTotals from "./GmeaRentalExpenseTotals";
import { useGmeaRentalExpenseForm, type Scope } from "../hooks/useGmeaRentalExpenseForm";
import GmeaRentalsDialog from "./GmeaRentalsDialog";


export default function GmeaRentalExpenseForm({
  rental,
  equipment,
  categories,
  expense,
  weekContext,
  lockWeekDates = false,
  readOnly = false,
  onClose,
  onSaved,
}: {
  rental?: GmeaRental;
  equipment: RentalEquipment[];
  categories: RentalExpenseCategory[];
  expense?: RentalExpense;
  weekContext?: RentalWeekMetadata;
  lockWeekDates?: boolean;
  readOnly?: boolean;
  onClose: () => void;
  onSaved?: (week: RentalWeekMetadata) => void;
}) {
  const { week, scope, form, choices, totals, pending, error, set, changeScope, changeWeek, submit } = useGmeaRentalExpenseForm({ rental, equipment, categories, expense, weekContext, onClose, onSaved });
  return (
    <GmeaRentalsDialog
      title={readOnly ? "Rental expense details" : expense ? "Edit rental expense" : "New rental expense"}
      description={week ? "Record this cutoff’s dated equipment, cash advance, or salary expense." : "Record Rentals operational spending and VAT treatment."}
      onClose={onClose}
      onSave={submit}
      pending={pending}
      error={error}
      saveLabel={expense ? "Save changes" : "Add expense"}
      readOnly={readOnly}
      wide
    >
      <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {week && <GmeaRentalWeekFields week={week} existing={!!expense || lockWeekDates} onChange={changeWeek} />}
        <Field label="Expense scope *">
          <select
            value={scope}
            onChange={(event) => changeScope(event.target.value as Scope)}
            className={rentalInputClass}
          >
            {(rental || expense?.rental_id) && <option value="rental">This rental</option>}
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
            min={week?.start}
            max={week?.end}
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
              set("vat_mode", event.target.value)
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
        <GmeaRentalExpenseTotals totals={totals} />
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
      </fieldset>
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

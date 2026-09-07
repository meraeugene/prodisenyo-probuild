"use client";
import { useState } from "react";
import type { GmeaProject, Quotation } from "../types";
import { today, inputClass } from "../utils/gmeaConstants";
import { formatMoney, quotationTotals } from "../utils/gmeaCalculations";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import { Field, TextField, VatFields } from "./GmeaFields";
import GmeaQuotationItems from "./GmeaQuotationItems";

export default function GmeaQuotationForm({
  project,
  quotation,
  readOnly = false,
  onClose,
}: {
  project: GmeaProject;
  quotation?: Quotation;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Quotation>(
    () =>
      quotation ?? {
        id: crypto.randomUUID(),
        project_id: project.id,
        reference: "",
        date: today(),
        notes: "",
        status: "draft",
        discount: 0,
        vat_mode: "off",
        vat_rate: 0,
        total: 0,
        items: [{ description: "", unit: "pcs", quantity: 1, unit_price: 0 }],
      },
  );
  const save = useGmeaMutation(project);
  let totals: ReturnType<typeof quotationTotals> | null = null,
    calculationError = "";
  try {
    totals = quotationTotals(form);
  } catch (e) {
    calculationError =
      e instanceof Error ? e.message : "Check the item amounts.";
  }
  return (
    <GmeaDialog
      title={
        readOnly
          ? "Quotation details"
          : quotation
            ? "Edit quotation"
            : "New quotation"
      }
      description={
        readOnly
          ? "This saved quotation is preserved in the project history."
          : "Enter items to calculate the quotation total automatically."
      }
      onClose={onClose}
      onSave={
        readOnly ? undefined : () => save({ kind: "quotation", value: form })
      }
    >
      <fieldset disabled={readOnly} className="min-w-0 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Quotation reference *"
            required
            maxLength={100}
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
          <TextField
            label="Quotation date *"
            required
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <GmeaQuotationItems
          items={form.items}
          readOnly={readOnly}
          onChange={(items) => setForm({ ...form, items })}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-4">
            <TextField
              label="Discount (PHP)"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.discount}
              onChange={(e) =>
                setForm({ ...form, discount: Number(e.target.value) })
              }
            />
            <VatFields
              mode={form.vat_mode}
              rate={form.vat_rate}
              onChange={(vat_mode, vat_rate) =>
                setForm({ ...form, vat_mode, vat_rate })
              }
            />
          </div>
          <div
            aria-live="polite"
            className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm"
          >
            {totals ? (
              <>
                <p className="flex justify-between gap-3">
                  <span>Subtotal</span>
                  <strong>{formatMoney(totals.subtotal)}</strong>
                </p>
                <p className="flex justify-between gap-3">
                  <span>Discount</span>
                  <strong>{formatMoney(totals.discount)}</strong>
                </p>
                <p className="flex justify-between gap-3">
                  <span>VAT-exclusive base</span>
                  <strong>{formatMoney(totals.base)}</strong>
                </p>
                <p className="flex justify-between gap-3">
                  <span>VAT</span>
                  <strong>{formatMoney(totals.vat)}</strong>
                </p>
                <p className="flex justify-between gap-3 border-t border-emerald-200 pt-3 text-lg">
                  <span>Total</span>
                  <strong>{formatMoney(totals.gross)}</strong>
                </p>
              </>
            ) : (
              <p className="text-rose-700">{calculationError}</p>
            )}
          </div>
        </div>
        <Field label="Notes">
          <textarea
            className={inputClass}
            rows={3}
            maxLength={2000}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
      </fieldset>
    </GmeaDialog>
  );
}

"use client";
import { useState } from "react";
import type { GmeaProject, Receipt } from "../types";
import { inputClass, today } from "../utils/gmeaConstants";
import { formatMoney, sumMoney } from "../utils/gmeaCalculations";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import { Field, TextField } from "./GmeaFields";
export default function GmeaReceiptForm({
  project,
  receipt,
  readOnly = false,
  onClose,
}: {
  project: GmeaProject;
  receipt?: Receipt;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Receipt>(
    () =>
      receipt ?? {
        id: crypto.randomUUID(),
        milestone_id: null,
        date: today(),
        cash: 0,
        withholding: 0,
        method: "",
        reference: "",
        notes: "",
      },
  );
  const save = useGmeaMutation(project);
  function update<K extends keyof Receipt>(key: K, value: Receipt[K]) {
    setForm({ ...form, [key]: value });
  }
  let settled: number | null = null;
  try { settled = sumMoney([form.cash, form.withholding]); } catch { /* Invalid input stays editable. */ }
  return (
    <GmeaDialog
      title={
        readOnly
          ? "Receipt details"
          : receipt
            ? "Edit receipt"
            : "Record payment"
      }
      onClose={onClose}
      onSave={
        readOnly ? undefined : () => save({ kind: "receipt", value: form })
      }
    >
      <fieldset disabled={readOnly} className="min-w-0 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Date *"
            type="date"
            required
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
          />
          <Field label="Milestone">
            <select
              className={inputClass}
              value={form.milestone_id ?? ""}
              onChange={(e) => update("milestone_id", e.target.value || null)}
            >
              <option value="">General payment</option>
              {project.milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <TextField
            label="Cash received (PHP)"
            required
            type="number"
            min="0"
            max="10000000000"
            step="0.01"
            value={form.cash}
            onChange={(e) => update("cash", Number(e.target.value))}
          />
          <TextField
            label="Withholding amount (PHP)"
            required
            type="number"
            min="0"
            max="10000000000"
            step="0.01"
            value={form.withholding}
            onChange={(e) => update("withholding", Number(e.target.value))}
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
            label="Bank / reference"
            maxLength={200}
            value={form.reference}
            onChange={(e) => update("reference", e.target.value)}
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
        <p className="rounded-xl bg-emerald-50 p-4 text-sm">
          Contract amount settled:{" "}
          <strong>
            {formatMoney(settled)}
          </strong>
        </p>
      </fieldset>
    </GmeaDialog>
  );
}

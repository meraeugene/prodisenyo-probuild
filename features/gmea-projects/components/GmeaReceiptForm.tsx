"use client";

import { useState } from "react";
import type { ContractPaymentTerm, GmeaProject } from "../types";
import { formatMoney, paymentTermSummary } from "../utils/gmeaCalculations";
import { today } from "../utils/gmeaConstants";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import { MoneyField, TextField } from "./GmeaFields";

export default function GmeaReceiptForm({
  project,
  term,
  onClose,
}: {
  project: GmeaProject;
  term: ContractPaymentTerm;
  onClose: () => void;
}) {
  const balance = paymentTermSummary(term).balance;
  const [form, setForm] = useState({
    id: crypto.randomUUID(),
    term_id: term.id,
    amount: balance,
    received_date: today(),
    method: "",
    reference_number: "",
    notes: "",
  });
  const save = useGmeaMutation(project);

  return (
    <GmeaDialog
      title="Record payment"
      description={term.description}
      onClose={onClose}
      onSave={() => save({ kind: "record_receipt", value: form })}
      saveLabel="Record payment"
      compact
    >
      <div className="rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3">
        <p className="text-xs font-medium text-teal-700">Remaining balance</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 tabular-nums">
          {formatMoney(balance)}
        </p>
      </div>
      <MoneyField
        label="Amount received (PHP) *"
        required
        value={form.amount}
        onValueChange={(amount) => setForm((current) => ({ ...current, amount }))}
      />
      <TextField
        label="Date received *"
        type="date"
        required
        max={today()}
        value={form.received_date}
        onChange={(event) => setForm((current) => ({ ...current, received_date: event.target.value }))}
      />
      <TextField
        label="Reference or note (optional)"
        maxLength={1000}
        placeholder="Cheque number, bank reference, or short note"
        value={form.notes}
        onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
      />
    </GmeaDialog>
  );
}

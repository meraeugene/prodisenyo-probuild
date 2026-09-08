"use client";

import { useState } from "react";
import type { ContractPaymentTerm, GmeaProject } from "../types";
import { paymentTermSummary } from "../utils/gmeaCalculations";
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
        label="Payment method"
        maxLength={100}
        placeholder="Cash, cheque, bank transfer…"
        value={form.method}
        onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))}
      />
      <TextField
        label="Reference number"
        maxLength={100}
        value={form.reference_number}
        onChange={(event) => setForm((current) => ({ ...current, reference_number: event.target.value }))}
      />
      <TextField
        label="Notes"
        maxLength={1000}
        value={form.notes}
        onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
      />
    </GmeaDialog>
  );
}

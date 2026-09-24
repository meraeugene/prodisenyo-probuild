"use client";

import { useState } from "react";
import type { GmeaRental } from "../types";
import { rentalCollectionSummary } from "../utils/collectionCalculations";
import { formatRentalMoney, rentalInputClass } from "../utils/rentalUi";
import { useGmeaRentalCollectionMutation } from "../hooks/useGmeaRentalCollectionMutation";
import GmeaRentalsDialog from "./GmeaRentalsDialog";

function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

export default function GmeaRentalPaymentForm({
  rental,
  onClose,
}: {
  rental: GmeaRental;
  onClose: () => void;
}) {
  const balance = rentalCollectionSummary(rental).balance;
  const [form, setForm] = useState({
    id: crypto.randomUUID(),
    amount: balance.toString(),
    payment_date: today(),
    method: "",
    reference_number: "",
    notes: "",
  });
  const { save, pending, error } = useGmeaRentalCollectionMutation(rental);

  function submit() {
    void save({
      kind: "record_payment",
      value: { ...form, amount: Number(form.amount) },
    })
      .then(onClose)
      .catch(() => undefined);
  }

  return (
    <GmeaRentalsDialog
      title="Record payment"
      description="Add a payment received for this rental."
      onClose={onClose}
      onSave={submit}
      pending={pending}
      error={error}
      saveLabel="Record payment"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3">
          <p className="text-xs font-medium text-teal-700">Remaining balance</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 tabular-nums">
            {formatRentalMoney(balance)}
          </p>
        </div>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          <span>Amount received (PHP) *</span>
          <input
            type="number"
            min="0.01"
            max={balance}
            step="0.01"
            required
            value={form.amount}
            onChange={(event) =>
              setForm((current) => ({ ...current, amount: event.target.value }))
            }
            className={rentalInputClass}
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          <span>Date received *</span>
          <input
            type="date"
            required
            max={today()}
            value={form.payment_date}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                payment_date: event.target.value,
              }))
            }
            className={rentalInputClass}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            <span>Payment method</span>
            <input
              maxLength={100}
              value={form.method}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  method: event.target.value,
                }))
              }
              className={rentalInputClass}
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            <span>Reference number</span>
            <input
              maxLength={100}
              value={form.reference_number}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reference_number: event.target.value,
                }))
              }
              className={rentalInputClass}
            />
          </label>
        </div>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          <span>Notes</span>
          <textarea
            maxLength={1000}
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            className={rentalInputClass + " min-h-20 py-3"}
          />
        </label>
      </div>
    </GmeaRentalsDialog>
  );
}

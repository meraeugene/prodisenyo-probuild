"use client";

import { useState } from "react";
import {
  CircleDollarSign,
  CreditCard,
  Landmark,
  WalletCards,
} from "lucide-react";
import type { GmeaRental, RentalPayment } from "../types";
import { rentalCollectionSummary } from "../utils/collectionCalculations";
import {
  formatRentalDate,
  formatRentalMoney,
  rentalPrimaryButtonClass,
} from "../utils/rentalUi";
import GmeaRentalPaymentForm from "./GmeaRentalPaymentForm";
import GmeaRentalVoidPaymentForm from "./GmeaRentalVoidPaymentForm";

export default function GmeaRentalCollectionsSection({
  rental,
  canEdit,
}: {
  rental: GmeaRental;
  canEdit: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [voiding, setVoiding] = useState<RentalPayment | null>(null);
  const summary = rentalCollectionSummary(rental);
  const tone = {
    Unpaid: "bg-slate-100 text-slate-700",
    "Partially Paid": "bg-amber-100 text-amber-800",
    Paid: "bg-teal-100 text-teal-800",
  }[summary.status];

  const cards = [
    {
      label: "Total Rental Charge",
      value: summary.charge,
      caption: "Equipment billing total",
      icon: WalletCards,
      color: "text-teal-700",
    },
    {
      label: "Amount Received",
      value: summary.received,
      caption: "Posted payments",
      icon: CircleDollarSign,
      color: "text-sky-600",
    },
    {
      label: "Remaining Balance",
      value: summary.balance,
      caption: "Still to be collected",
      icon: Landmark,
      color: "text-rose-600",
    },
  ];

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Collections
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Payments, remaining balance, and complete audit history.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            disabled={summary.balance <= 0}
            onClick={() => setRecording(true)}
            className={rentalPrimaryButtonClass}
          >
            <CreditCard size={16} aria-hidden="true" /> Record payment
          </button>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ label, value, caption, icon: Icon, color }) => (
          <article
            key={label}
            className="min-h-28 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,.045)]"
          >
            <div className="flex items-center gap-2">
              <Icon size={14} className={color} aria-hidden="true" />
              <p className="text-sm font-medium text-slate-500">{label}</p>
            </div>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">
              {formatRentalMoney(value)}
            </p>
            <p className="mt-1 text-xs text-slate-400">{caption}</p>
          </article>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
        <span className="text-sm font-medium text-slate-600">
          Payment status
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}
        >
          {summary.status}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-900">
            Payment history
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {rental.payments.map((payment) => (
            <article
              key={payment.id}
              className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${payment.status === "voided" ? "bg-rose-50/60 text-slate-500" : "bg-white"}`}
            >
              <div
                className={payment.status === "voided" ? "line-through" : ""}
              >
                <p className="font-semibold text-slate-950">
                  {formatRentalMoney(payment.amount)}{" "}
                  <span className="font-normal text-slate-400">·</span>{" "}
                  {formatRentalDate(payment.payment_date)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {[payment.method, payment.reference_number, payment.notes]
                    .filter(Boolean)
                    .join(" · ") || "No additional details"}
                </p>
                {payment.status === "voided" && (
                  <p className="mt-1 text-xs font-medium text-rose-700 no-underline">
                    Voided: {payment.void_reason}
                  </p>
                )}
              </div>
              {canEdit && payment.status === "posted" && (
                <button
                  type="button"
                  onClick={() => setVoiding(payment)}
                  className="self-start rounded-lg px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 sm:self-auto"
                >
                  Void payment
                </button>
              )}
            </article>
          ))}
          {!rental.payments.length && (
            <p className="p-8 text-center text-sm text-slate-500">
              No payments recorded.
            </p>
          )}
        </div>
      </div>

      {recording && (
        <GmeaRentalPaymentForm
          rental={rental}
          onClose={() => setRecording(false)}
        />
      )}
      {voiding && (
        <GmeaRentalVoidPaymentForm
          rental={rental}
          payment={voiding}
          onClose={() => setVoiding(null)}
        />
      )}
    </section>
  );
}

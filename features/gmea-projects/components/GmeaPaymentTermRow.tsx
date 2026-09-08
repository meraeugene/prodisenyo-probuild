"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Ban } from "lucide-react";
import type { ContractPaymentTerm, ContractReceipt, GmeaProject } from "../types";
import { formatMoney, paymentTermSummary } from "../utils/gmeaCalculations";
import { secondaryClass } from "../utils/gmeaConstants";
import GmeaReceiptForm from "./GmeaReceiptForm";
import GmeaVoidReceiptForm from "./GmeaVoidReceiptForm";

function formatDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(value + "T00:00:00Z")
    : new Date(value);
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function GmeaPaymentTermRow({
  project,
  term,
  canEdit,
}: {
  project: GmeaProject;
  term: ContractPaymentTerm;
  canEdit: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiding, setVoiding] = useState<ContractReceipt | null>(null);
  const summary = paymentTermSummary(term);
  const badge = {
    unpaid: "bg-slate-100 text-slate-700",
    partial: "bg-amber-100 text-amber-800",
    paid: "bg-emerald-100 text-emerald-800",
  }[summary.status];

  return (
    <Fragment>
      <tr>
        <td className="p-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-left font-medium text-slate-900"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {term.description}
          </button>
          {term.notes && <p className="mt-1 pl-6 text-xs text-amber-700">Legacy/contract note: {term.notes}</p>}
        </td>
        <td className="p-3 text-slate-600">
          {term.value_mode === "percentage" ? `${term.percentage}%` : "Fixed"}
        </td>
        <td className="p-3 font-semibold">{formatMoney(term.amount)}</td>
        <td className="p-3">{formatMoney(summary.received)}</td>
        <td className="p-3">{formatMoney(summary.balance)}</td>
        <td className="p-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badge}`}>
            {summary.status}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50/70">
          <td colSpan={6} className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment history</p>
              {canEdit && summary.balance > 0 && (
                <button type="button" className={secondaryClass} onClick={() => setRecording(true)}>
                  <Plus size={15} /> Record payment
                </button>
              )}
            </div>
            <div className="space-y-2">
              {term.receipts.map((receipt) => (
                <div key={receipt.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm ${receipt.status === "voided" ? "border-rose-100 bg-rose-50 text-slate-500 line-through" : "border-slate-200 bg-white"}`}>
                  <div>
                    <p className="font-semibold">{formatMoney(receipt.amount)} · {formatDate(receipt.received_date)}</p>
                    <p className="mt-1 text-xs">
                      {[receipt.method, receipt.reference_number, receipt.notes].filter(Boolean).join(" · ") || "No additional details"}
                    </p>
                    {receipt.status === "voided" && <p className="mt-1 text-xs text-rose-700 no-underline">Voided: {receipt.void_reason}</p>}
                  </div>
                  {canEdit && receipt.status === "posted" && (
                    <button type="button" className={secondaryClass + " text-rose-700"} onClick={() => setVoiding(receipt)}>
                      <Ban size={15} /> Void
                    </button>
                  )}
                </div>
              ))}
              {!term.receipts.length && <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">No payments recorded.</p>}
            </div>
          </td>
        </tr>
      )}
      {recording && <GmeaReceiptForm project={project} term={term} onClose={() => setRecording(false)} />}
      {voiding && <GmeaVoidReceiptForm project={project} receipt={voiding} onClose={() => setVoiding(null)} />}
    </Fragment>
  );
}

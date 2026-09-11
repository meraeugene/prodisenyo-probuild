"use client";

import { useState } from "react";
import { CreditCard, Eye, Trash2 } from "lucide-react";
import type { ContractPaymentTerm, ContractReceipt, GmeaProject } from "../types";
import { formatMoney, paymentTermSummary } from "../utils/gmeaCalculations";
import { secondaryClass } from "../utils/gmeaConstants";
import GmeaReceiptForm from "./GmeaReceiptForm";
import GmeaVoidReceiptForm from "./GmeaVoidReceiptForm";
import GmeaDialog from "./GmeaDialog";
import { removePaymentTerm } from "../utils/paymentTerms";
import { useGmeaMutation } from "../hooks/useGmeaMutation";

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
  index,
}: {
  project: GmeaProject;
  term: ContractPaymentTerm;
  canEdit: boolean;
  index: number;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiding, setVoiding] = useState<ContractReceipt | null>(null);
  const [deleting, setDeleting] = useState(false);
  const save = useGmeaMutation(project);
  const summary = paymentTermSummary(term);
  const badge = {
    unpaid: "bg-slate-100 text-slate-700",
    partial: "bg-amber-100 text-amber-800",
    paid: "bg-teal-100 text-teal-800",
  }[summary.status];

  return (
    <>
      <tr className="transition-colors hover:bg-slate-50/70">
        <td className="p-4 text-slate-500">{index + 1}</td>
        <td className="p-3">
          <p className="font-medium text-slate-900">{term.description}</p>
          {term.notes && <p className="mt-1 text-xs text-amber-700">Legacy/contract note: {term.notes}</p>}
          <button type="button" onClick={() => setHistoryOpen(true)} className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900">
            <Eye size={13} aria-hidden="true" /> View payment history
          </button>
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
        <td className="p-3">
          {canEdit && (
            <div className="flex flex-nowrap items-center justify-end gap-1">
              <button type="button" disabled={summary.balance <= 0} onClick={() => setRecording(true)} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-35">
                <CreditCard size={14} aria-hidden="true" /> Record payment
              </button>
              <button type="button" disabled={term.receipts.length > 0 || project.payment_terms.length <= 1} onClick={() => setDeleting(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-35">
                <Trash2 size={14} aria-hidden="true" /> Delete
              </button>
            </div>
          )}
        </td>
      </tr>
      {historyOpen && (
        <GmeaDialog title="Payment history" description={term.description} onClose={() => setHistoryOpen(false)} compact>
          <div className="space-y-2">
            {term.receipts.map((receipt) => (
              <div key={receipt.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm ${receipt.status === "voided" ? "border-rose-100 bg-rose-50 text-slate-500 line-through" : "border-slate-200 bg-white"}`}>
                <div>
                  <p className="font-semibold">{formatMoney(receipt.amount)} · {formatDate(receipt.received_date)}</p>
                  <p className="mt-1 text-xs">
                    {[receipt.method, receipt.reference_number, receipt.notes].filter(Boolean).join(" · ") || "No additional details"}
                  </p>
                  {receipt.status === "voided" && <p className="mt-1 text-xs text-rose-700 no-underline">Voided: {receipt.void_reason}</p>}
                </div>
                {canEdit && receipt.status === "posted" && (
                  <button type="button" className={secondaryClass + " text-rose-700"} onClick={() => { setHistoryOpen(false); setVoiding(receipt); }}>
                    Void
                  </button>
                )}
              </div>
            ))}
            {!term.receipts.length && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">No payments recorded.</p>}
          </div>
        </GmeaDialog>
      )}
      {recording && <GmeaReceiptForm project={project} term={term} onClose={() => setRecording(false)} />}
      {voiding && <GmeaVoidReceiptForm project={project} receipt={voiding} onClose={() => setVoiding(null)} />}
      {deleting && <GmeaDialog title="Delete payment term?" onClose={() => setDeleting(false)} onSave={() => save({ kind: "contract_terms", value: { contract_amount: project.contract_amount, payment_terms: removePaymentTerm(project.payment_terms, term.id, project.contract_amount) } })} saveLabel="Delete term" compact danger><p className="text-sm leading-6 text-slate-600">Remove <strong className="font-semibold text-slate-900">{term.description}</strong>? Its scheduled amount will be moved to the final remaining payment term.</p></GmeaDialog>}
    </>
  );
}

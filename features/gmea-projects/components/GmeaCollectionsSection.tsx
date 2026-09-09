"use client";

import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import type { GmeaProject } from "../types";
import { buttonClass } from "../utils/gmeaConstants";
import {
  contractCollectionSummary,
  formatMoney,
} from "../utils/gmeaCalculations";
import GmeaCollectionForm from "./GmeaCollectionForm";
import GmeaPaymentTermRow from "./GmeaPaymentTermRow";

export default function GmeaCollectionsSection({
  project,
  canEdit,
}: {
  project: GmeaProject;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const terms = project.payment_terms ?? [];
  const summary = contractCollectionSummary(project);
  const ActionIcon = canEdit ? Pencil : Eye;

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Payment schedule and collections
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Milestones, receipts, and remaining balances.
          </p>
        </div>
        <button className={buttonClass} onClick={() => setOpen(true)}>
          <ActionIcon size={17} />
          {canEdit ? "Edit contract terms" : "View contract terms"}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Contract amount", project.contract_amount],
          ["Received", summary.received],
          ["Outstanding", summary.outstanding],
        ].map(([name, value]) => (
          <div
            key={String(name)}
            className="min-w-0 rounded-xl bg-slate-50 p-5"
          >
            <p className="text-xs text-slate-500">{name}</p>
            <p className="mt-2 break-words text-xl font-semibold tracking-tight text-slate-950 tabular-nums">
              {formatMoney(Number(value))}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600 [&_th]:py-4">
            <tr>
              <th className="p-3">Description</th>
              <th className="p-3">Basis</th>
              <th className="p-3">Scheduled</th>
              <th className="p-3">Received</th>
              <th className="p-3">Balance</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 tabular-nums [&>tr:hover]:bg-slate-50/60">
            {terms.map((term) => (
              <GmeaPaymentTermRow
                key={term.id}
                project={project}
                term={term}
                canEdit={canEdit}
              />
            ))}
            {!terms.length && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Add the contract payment schedule.
                </td>
              </tr>
            )}
          </tbody>
          {!!terms.length && (
            <tfoot className="border-t border-slate-200 bg-slate-50 text-slate-950 tabular-nums [&_td]:py-4">
              <tr>
                <td colSpan={2} className="p-3 text-right font-semibold">
                  Total
                </td>
                <td className="p-3 font-bold">
                  {formatMoney(summary.scheduled)}
                </td>
                <td className="p-3 font-bold">
                  {formatMoney(summary.received)}
                </td>
                <td className="p-3 font-bold">
                  {formatMoney(summary.outstanding)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {open && (
        <GmeaCollectionForm
          project={project}
          readOnly={!canEdit}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}

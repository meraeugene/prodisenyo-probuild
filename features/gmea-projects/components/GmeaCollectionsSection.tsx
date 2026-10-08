"use client";

import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import type { GmeaProject } from "../types";
import { secondaryClass } from "../utils/gmeaConstants";
import {
  contractCollectionSummary,
  formatMoney,
  projectSummary,
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
  const projectTotals = projectSummary(project);

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Payment schedule and collections
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Milestones, receipts, and remaining balances.
          </p>
        </div>
        <button className={secondaryClass + " gap-2 bg-white shadow-sm"} onClick={() => setOpen(true)}>
          {canEdit ? <Pencil size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          {canEdit ? "Edit contract terms" : "View contract terms"}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { name: "Contract amount", value: projectTotals.contract, caption: "Total including project tax" },
          { name: "Received", value: summary.received, caption: "Payments collected" },
          { name: "Outstanding", value: summary.outstanding, caption: "Balance remaining" },
        ].map(({ name, value, caption }) => (
          <div
            key={name}
            className="min-h-28 min-w-0 rounded-2xl border border-transparent bg-white p-5 shadow-workspace"
          >
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-500">{name}</p>
            </div>
            <p className="mt-1 break-words text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">
              {formatMoney(value)}
            </p>
            <p className="mt-1 text-xs text-slate-400">{caption}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table data-row-hover="none" className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600 [&_th]:py-4">
            <tr>
              <th className="w-12 p-3 text-center">#</th>
              <th className="p-3">Description</th>
              <th className="p-3">Basis</th>
              <th className="p-3">Scheduled</th>
              <th className="p-3">Received</th>
              <th className="p-3">Balance</th>
              <th className="p-3">Status</th>
              <th className="w-56 p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 tabular-nums">
            {terms.map((term, index) => (
              <GmeaPaymentTermRow
                key={term.id}
                project={project}
                term={term}
                canEdit={canEdit}
                index={index}
              />
            ))}
            {!terms.length && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  Add the contract payment schedule.
                </td>
              </tr>
            )}
          </tbody>
          {!!terms.length && (
            <tfoot className="border-t border-slate-200 bg-slate-50 text-slate-950 tabular-nums [&_td]:py-4">
              <tr>
                <td colSpan={3} className="p-3 text-right font-semibold">
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
                <td /><td />
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

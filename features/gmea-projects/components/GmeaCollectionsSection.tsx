"use client";

import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import type { GmeaProject } from "../types";
import { buttonClass } from "../utils/gmeaConstants";
import { formatMoney, sumMoney } from "../utils/gmeaCalculations";
import GmeaCollectionForm from "./GmeaCollectionForm";

export default function GmeaCollectionsSection({
  project,
  canEdit,
}: {
  project: GmeaProject;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const collections = project.collections ?? [];
  const collected = sumMoney(collections.map((item) => item.amount));
  const balance = Math.max(0, project.contract_amount - collected);
  const ActionIcon = canEdit ? Pencil : Eye;

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Contract collections</h2>
          <p className="mt-1 text-sm text-slate-500">
            Contract collection schedule based on the 80% down payment and 20%
            completion balance.
          </p>
        </div>
        <button className={buttonClass} onClick={() => setOpen(true)}>
          <ActionIcon size={17} />
          {canEdit ? "Edit schedule" : "View schedule"}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Contract amount", project.contract_amount],
          ["Scheduled collections", collected],
          ["Balance", balance],
        ].map(([name, value]) => (
          <div
            key={String(name)}
            className="rounded-xl border border-slate-200 p-4"
          >
            <p className="text-xs text-slate-500">{name}</p>
            <p className="mt-2 text-lg font-semibold">
              {formatMoney(Number(value))}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="p-3">Description</th>
              <th className="w-48 p-3">Amount</th>
              <th className="p-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {collections.map((item) => (
              <tr key={item.id}>
                <td className="p-3 font-medium">{item.description}</td>
                <td className="p-3 font-semibold">
                  {formatMoney(item.amount)}
                </td>
                <td className="p-3 text-slate-600">{item.notes || "—"}</td>
              </tr>
            ))}
            {!collections.length && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-500">
                  Save the 80/20 contract collection schedule.
                </td>
              </tr>
            )}
          </tbody>
          {!!collections.length && (
            <tfoot className="border-t border-slate-200 bg-amber-50">
              <tr>
                <td className="p-3 text-right font-semibold">Total</td>
                <td className="p-3 font-bold">{formatMoney(collected)}</td>
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

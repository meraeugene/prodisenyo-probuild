"use client";
import { useState } from "react";
import type { GmeaProject, Receipt } from "../types";
import { buttonClass, secondaryClass } from "../utils/gmeaConstants";
import {
  formatMoney,
  milestoneSummary,
  projectSummary,
} from "../utils/gmeaCalculations";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaReceiptForm from "./GmeaReceiptForm";
import GmeaAllocationForm from "./GmeaAllocationForm";
import GmeaConfirmButton from "./GmeaConfirmButton";
export default function GmeaPaymentsSection({
  project,
  canEdit,
}: {
  project: GmeaProject;
  canEdit: boolean;
}) {
  const [milestones, setMilestones] = useState(false),
    [editor, setEditor] = useState<{ receipt?: Receipt } | null>(null);
  const save = useGmeaMutation(project),
    summary = projectSummary(project);
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Payments</h2>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button
              className={secondaryClass}
              onClick={() => setMilestones(true)}
            >
              Edit milestones
            </button>
            <button className={buttonClass} onClick={() => setEditor({})}>
              Record payment
            </button>
          </div>
        )}
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Cash received", summary.cash],
          ["Withholding recorded", summary.withholding],
          ["Overpayment", summary.overpayment],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 font-semibold">
              {formatMoney(value as number | null)}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {project.milestones.map((m) => {
          const s = milestoneSummary(project, m.id);
          return (
            <div key={m.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between gap-3">
                <h3 className="font-semibold">{m.label}</h3>
                <span className="text-sm text-emerald-700">{s.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {m.percentage}% · Due {formatMoney(s.due)}
              </p>
              <p className="mt-2 text-sm">Settled {formatMoney(s.settled)}</p>
            </div>
          );
        })}
      </div>
      {!project.milestones.length && (
        <p className="text-sm text-slate-500">
          No milestones configured. Receipts can still be recorded as general
          payments.
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              {[
                "Date",
                "Milestone / method",
                "Cash",
                "Withholding",
                "Reference",
                "Actions",
              ].map((h) => (
                <th className="p-3" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {project.receipts.map((r) => (
              <tr key={r.id}>
                <td className="p-3">{r.date}</td>
                <td className="p-3">
                  {project.milestones.find((m) => m.id === r.milestone_id)
                    ?.label ?? "General payment"}
                  <p className="text-xs text-slate-500">{r.method}</p>
                </td>
                <td className="p-3">{formatMoney(r.cash)}</td>
                <td className="p-3">{formatMoney(r.withholding)}</td>
                <td className="p-3">{r.reference || "—"}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      className={secondaryClass}
                      onClick={() => setEditor({ receipt: r })}
                    >
                      {canEdit ? "Edit" : "Details"}
                    </button>
                    {canEdit && (
                      <GmeaConfirmButton
                        label="Delete receipt"
                        danger
                        description="Remove this receipt and recalculate the project balances?"
                        onConfirm={() =>
                          save({ kind: "delete", entity: "receipt", id: r.id })
                        }
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!project.receipts.length && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No payments recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editor && (
        <GmeaReceiptForm
          project={project}
          receipt={editor.receipt}
          readOnly={!canEdit}
          onClose={() => setEditor(null)}
        />
      )}
      {milestones && (
        <GmeaAllocationForm
          project={project}
          kind="milestones"
          onClose={() => setMilestones(false)}
        />
      )}
    </section>
  );
}

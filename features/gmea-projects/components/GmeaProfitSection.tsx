"use client";
import { useState } from "react";
import type { GmeaProject } from "../types";
import { formatMoney, projectSummary } from "../utils/gmeaCalculations";
import { secondaryClass } from "../utils/gmeaConstants";
import GmeaAllocationForm from "./GmeaAllocationForm";
export default function GmeaProfitSection({
  project,
  canEdit,
}: {
  project: GmeaProject;
  canEdit: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const s = projectSummary(project);
  const lines: [string, number | null][] = [
    ["Contract value", s.contract],
    ["Total project expenses", s.expenses],
    ["Contract profit / loss", s.profit],
    ["Recorded withholding", s.withholding],
    ["Amount available for sharing", s.sharing],
    ["Distributable profit", s.distributable],
  ];
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Profit summary</h2>
        {canEdit && (
          <button className={secondaryClass} onClick={() => setEdit(true)}>
            Edit partners
          </button>
        )}
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 px-5">
          {lines.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-wrap justify-between gap-2 py-4"
            >
              <dt className="text-sm text-slate-600">{label}</dt>
              <dd
                className={
                  "font-semibold " +
                  (value !== null && value < 0
                    ? "text-rose-700"
                    : "text-slate-900")
                }
              >
                {formatMoney(value)}
              </dd>
            </div>
          ))}
        </dl>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Amount available for sharing = contract value − recorded withholding
            − expenses. A loss remains visible; distributable profit is zero
            when the result is negative.
          </p>
          {s.partners.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-5"
            >
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {p.percentage}% share
                </p>
              </div>
              <strong>{formatMoney(p.amount)}</strong>
            </div>
          ))}
          {s.contract === null && (
            <p className="text-sm text-slate-500">
              Accept a quotation to calculate profit and partner shares.
            </p>
          )}
        </div>
      </div>
      {edit && (
        <GmeaAllocationForm
          project={project}
          kind="partners"
          onClose={() => setEdit(false)}
        />
      )}
    </section>
  );
}

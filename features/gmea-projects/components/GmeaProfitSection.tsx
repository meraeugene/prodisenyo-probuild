"use client";
import { useState } from "react";
import type { GmeaProject } from "../types";
import { formatMoney, projectSummary } from "../utils/gmeaCalculations";
import { secondaryClass } from "../utils/gmeaConstants";
import GmeaPartnerForm from "./GmeaPartnerForm";
export default function GmeaProfitSection({
  project,
  canEdit,
}: {
  project: GmeaProject;
  canEdit: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const s = projectSummary(project);
  const lines: [string, number][] = [
    ["Contract amount", s.contract],
    ["Total project expenses", s.expenses],
    ["Total net profit", s.profit],
  ];
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Contract cost summary</h2>
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
            Net profit is the contract amount less all project expenses.
            Partner shares are calculated from positive net profit.
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
        </div>
      </div>
      {edit && (
        <GmeaPartnerForm
          project={project}
          onClose={() => setEdit(false)}
        />
      )}
    </section>
  );
}

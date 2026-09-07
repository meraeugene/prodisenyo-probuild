import { formatMoney, projectSummary } from "../utils/gmeaCalculations";
import type { GmeaProject } from "../types";
export default function GmeaSummaryCards({
  project,
}: {
  project: GmeaProject;
}) {
  const s = projectSummary(project);
  const entries: [string, number | null][] = [
    ["Contract value", s.contract],
    ["Expenses", s.expenses],
    ["Cash received", s.cash],
    ["Outstanding balance", s.outstanding],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {entries.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 break-words text-xl font-semibold tracking-tight text-slate-900">
            {formatMoney(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

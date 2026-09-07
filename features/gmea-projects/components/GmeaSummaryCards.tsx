import { formatMoney, projectSummary } from "../utils/gmeaCalculations";
import type { GmeaProject } from "../types";
import { formatProjectDuration } from "../utils/gmeaFormatters";
export default function GmeaSummaryCards({
  project,
}: {
  project: GmeaProject;
}) {
  const s = projectSummary(project);
  const entries: [string, string][] = [
    ["Contract amount", formatMoney(s.contract)],
    ["Total project expenses", formatMoney(s.expenses)],
    ["Total net profit", formatMoney(s.profit)],
    ["Project duration", formatProjectDuration(project.duration)],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {entries.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 break-words text-xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

import { formatMoney, projectSummary } from "../utils/gmeaCalculations";
import type { GmeaProject } from "../types";
export default function GmeaSummaryCards({
  project,
}: {
  project: GmeaProject;
}) {
  const s = projectSummary(project);
  const entries: [string, number][] = [
    ["Gross contract amount", s.contract],
    ["Withholding tax", s.withholding],
    ["Net contract amount", s.netContract],
    ["Total project expenses", s.expenses],
    ["Total net profit", s.profit],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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

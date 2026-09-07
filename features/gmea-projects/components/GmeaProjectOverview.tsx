import type { GmeaProject } from "../types";
import { formatMoney, projectSummary } from "../utils/gmeaCalculations";
export default function GmeaProjectOverview({
  project,
}: {
  project: GmeaProject;
}) {
  const s = projectSummary(project);
  const details = [
    ["Client", project.client],
    ["Project location", project.location],
    ["Gross contract amount", formatMoney(s.contract)],
    ["Withholding tax", formatMoney(s.withholding)],
    ["Net contract amount", formatMoney(s.netContract)],
    ["Project duration", project.duration],
    ["Status", project.status.replace("_", " ")],
  ];
  return (
    <div className="space-y-5">
      <dl className="grid gap-5 sm:grid-cols-2">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {label}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {value || "Not set"}
            </dd>
          </div>
        ))}
      </dl>
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm">
        <p>
          Total net profit: <strong>{formatMoney(s.profit)}</strong>
        </p>
      </div>
    </div>
  );
}

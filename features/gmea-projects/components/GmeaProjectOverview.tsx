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
    ["Location", project.location],
    ["Duration", project.duration],
    ["Start date", project.start_date],
    ["End date", project.end_date],
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
      {project.description && (
        <p className="whitespace-pre-wrap text-sm text-slate-600">
          {project.description}
        </p>
      )}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm">
        <p>
          Contract profit / loss: <strong>{formatMoney(s.profit)}</strong>
        </p>
        <p className="mt-2">
          Available for sharing: <strong>{formatMoney(s.sharing)}</strong>
        </p>
        {s.contract === null && (
          <p className="mt-3 text-slate-500">
            Accept a quotation to set the contract value and calculate balances.
          </p>
        )}
        {(s.overpayment ?? 0) > 0 && (
          <p className="mt-2">
            Overpayment: <strong>{formatMoney(s.overpayment)}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

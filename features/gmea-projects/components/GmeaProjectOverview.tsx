import type { GmeaProject } from "../types";
import type { ReactNode } from "react";
import GmeaProjectStatusBadge from "./GmeaProjectStatusBadge";
import { formatMoney, projectSummary } from "../utils/gmeaCalculations";
import { formatProjectDuration } from "../utils/gmeaFormatters";
export default function GmeaProjectOverview({
  project,
}: {
  project: GmeaProject;
}) {
  const s = projectSummary(project);
  const details: [string, ReactNode][] = [
    ["Project name", project.name],
    ["Client", project.client],
    ["Project location", project.location],
    ["Project status", <GmeaProjectStatusBadge key="status" status={project.status} />],
    ["Pre-tax contract amount", formatMoney(s.baseContract)],
    ["Project tax", `${s.taxRate}% (${formatMoney(s.taxAmount)})`],
    ["Total contract amount", formatMoney(s.contract)],
    ["Project duration", formatProjectDuration(project.duration)],
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
      <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 text-sm">
        <p>
          Net profit after deducting project tax and expenses: <strong>{formatMoney(s.profit)}</strong>
        </p>
      </div>
    </div>
  );
}

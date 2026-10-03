import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
﻿import { formatMoney, projectSummary } from "../utils/gmeaCalculations";
import type { GmeaProject } from "../types";
import { formatProjectDuration } from "../utils/gmeaFormatters";

export default function GmeaSummaryCards({
  project,
}: {
  project: GmeaProject;
}) {
  const s = projectSummary(project);
  const entries = [
    { label: "Contract amount", value: formatMoney(s.contract), caption: "Total including project tax" },
    { label: "Total project expenses", value: formatMoney(s.expenses), caption: "Actual expenses to date" },
    { label: "Total net profit", value: formatMoney(s.profit), caption: "Gross contract minus tax and expenses" },
    { label: "Project duration", value: formatProjectDuration(project.duration), caption: "Project timeline" },
  ];
  return <WorkspaceSummaryCards ariaLabel="Project financial summary" className="xl:grid-cols-4" cards={entries.map(({ label, value, caption }) => ({ label, value, hint: caption }))} />;
}

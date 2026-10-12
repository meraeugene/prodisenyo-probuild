import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
const ITEMS = [
  { key: "projects", label: "Total projects", caption: "All assigned records",  tone: "blue" },
  { key: "active", label: "Active projects", caption: "In progress",  tone: "teal" },
  { key: "estimates", label: "Pending estimates", caption: "Not operational yet",  tone: "amber" },
  { key: "completed", label: "Completed", caption: "Finished projects",  tone: "emerald" },
  { key: "onHold", label: "On hold", caption: "Requires follow-up", tone: "amber" },
] as const;

export default function EngineerDashboardSummary({
  values,
}: {
  values: Record<(typeof ITEMS)[number]["key"], number>;
}) {
  return <WorkspaceSummaryCards ariaLabel="Engineer workflow summary" className="grid-cols-2 xl:grid-cols-5" cards={ITEMS.map(item => ({ label: item.label, value: values[item.key], hint: item.caption }))} />;
}

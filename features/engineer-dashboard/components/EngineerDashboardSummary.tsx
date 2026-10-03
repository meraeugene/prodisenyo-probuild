import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
const ITEMS = [
  { key: "projects", label: "Total projects", caption: "All assigned records",  tone: "blue" },
  { key: "active", label: "Active projects", caption: "In progress",  tone: "teal" },
  { key: "estimates", label: "Pending estimates", caption: "Not operational yet",  tone: "amber" },
  { key: "completed", label: "Completed", caption: "Finished projects",  tone: "emerald" },
] as const;

export default function EngineerDashboardSummary({
  values,
}: {
  values: Record<(typeof ITEMS)[number]["key"], number>;
}) {
  return <WorkspaceSummaryCards ariaLabel="Engineer workflow summary" cards={ITEMS.map(item => ({ label: item.label, value: values[item.key], hint: item.caption }))} />;
}

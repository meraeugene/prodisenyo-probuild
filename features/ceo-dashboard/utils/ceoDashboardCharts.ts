import type { CeoDashboardProject } from "../types";

export function buildCeoDashboardCharts(projects: CeoDashboardProject[], sort: string) {
  const statuses = [
    { key: "active", name: "Active", color: "#087d76" },
    { key: "planning", name: "Planning", color: "#f5ce65" },
    { key: "completed", name: "Completed", color: "#a6e3de" },
    { key: "on_hold", name: "On hold", color: "#fb8589" },
  ].map((status) => ({ ...status, value: projects.filter((project) => project.status === status.key).length }));
  const locations = new Map<string, number>();
  projects.forEach((project) => {
    const name = project.location?.trim() || "Location not set";
    locations.set(name, (locations.get(name) ?? 0) + 1);
  });
  return {
    statuses,
    budgets: [...projects].sort((a, b) => sort === "spent" ? b.spent - a.spent : b.budget - a.budget)
      .slice(0, 6).map((project) => ({ name: project.name, budget: project.budget, spent: project.spent })),
    locations: [...locations].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
  };
}

export function formatCeoChartMoney(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function shortenCeoChartLabel(value: string) {
  return value.length > 13 ? value.slice(0, 12) + "…" : value;
}

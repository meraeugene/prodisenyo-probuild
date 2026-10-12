export const CEO_PROJECT_WORKSPACE_TABS = [
  "overview",
  "estimates",
  "materials",
  "documents",
  "activity-log",
  "cost-tracking",
] as const;

export const ENGINEER_PROJECT_WORKSPACE_TABS = [
  "overview",
  "activities",
  "progress-updates",
  "materials",
  "documents",
  "activity-log",
  "cost-tracking",
] as const;

export type ProjectWorkspaceTab =
  | (typeof CEO_PROJECT_WORKSPACE_TABS)[number]
  | (typeof ENGINEER_PROJECT_WORKSPACE_TABS)[number];

export function getProjectWorkspaceTabLabel(tab: string) {
  const labels: Record<string, string> = { overview: "Overview", activities: "Activities", estimates: "Estimates", "progress-updates": "Progress updates", materials: "Materials", documents: "Documents", "activity-log": "Activity log", "cost-tracking": "Cost tracking" };
  return labels[tab] ?? tab.replaceAll("-", " ");
}

export function resolveProjectWorkspaceTab(
  selected: string | null,
  tabs: readonly ProjectWorkspaceTab[],
): ProjectWorkspaceTab {
  if (selected === "purchasing") return "materials";
  return tabs.includes(selected as ProjectWorkspaceTab)
    ? (selected as ProjectWorkspaceTab)
    : "overview";
}

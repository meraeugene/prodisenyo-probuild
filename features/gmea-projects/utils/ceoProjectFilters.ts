export const CEO_PROJECT_TABS = ["Active", "Completed", "All Projects", "On Track", "At Risk", "For Collection"] as const;
export type CeoProjectTab = (typeof CEO_PROJECT_TABS)[number];

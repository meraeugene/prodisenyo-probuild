"use client";

import type { SidebarNavigationContext } from "../types";
import { getDashboardNavigationGroups } from "../utils/dashboardNavigationItems";
import SidebarNavigationSection from "./SidebarNavigationSection";

export default function DashboardNavigation(props: SidebarNavigationContext) {
  const groups = getDashboardNavigationGroups(props.role);

  return (
    <nav aria-label="Main navigation" className="space-y-1">
      {groups.map((group, index) => (
        <SidebarNavigationSection key={group.label ?? index} group={group} {...props} />
      ))}
    </nav>
  );
}

import { SkeletonBlock } from "@/components/LoadingSkeleton";
import WorkspaceTableSkeleton from "./WorkspaceTableSkeleton";
import WorkspaceFiltersSkeleton from "./WorkspaceFiltersSkeleton";

export default function WorkspaceListSkeleton({ columns = 6, rows = 10, tabs = 3, filters = true, filterCount = 1, tabLabels, minWidth = 720, rowHeight = 44, firstColumnLines = 1, mobileCards = false, mobileBreakpoint = "md", columnWidths, embedded = false }: {
  columns?: number; rows?: number; tabs?: number; filters?: boolean; filterCount?: number; tabLabels?: readonly string[];
  minWidth?: number; rowHeight?: number; firstColumnLines?: number; mobileCards?: boolean; mobileBreakpoint?: "md" | "lg" | "xl"; columnWidths?: readonly string[]; embedded?: boolean;
}) {
  return <div aria-hidden="true" data-workspace-list-skeleton="true" data-skeleton-panel={embedded ? undefined : "true"} className={embedded ? "min-w-0" : "skeleton-surface min-w-0 overflow-hidden"}>
    <WorkspaceFiltersSkeleton {...{ tabs, tabLabels, filters, filterCount }} />
    <WorkspaceTableSkeleton {...{ columns, rows, minWidth, rowHeight, firstColumnLines, mobileCards, mobileBreakpoint, columnWidths }} />
    <div className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-3"><SkeletonBlock className="h-4 w-40" /><div className="flex flex-wrap items-center gap-4"><SkeletonBlock className="h-8 w-36" /><SkeletonBlock className="h-8 w-60" /></div></div>
  </div>;
}

import { SkeletonBlock } from "@/components/LoadingSkeleton";
import styles from "./workspace.module.css";

export default function WorkspaceTableSkeleton({ columns = 6, rows = 10, minWidth = 720, rowHeight = 44, firstColumnLines = 1, mobileCards = false, mobileBreakpoint = "md", columnWidths }: {
  columns?: number; rows?: number; minWidth?: number; rowHeight?: number; firstColumnLines?: number;
  mobileCards?: boolean; mobileBreakpoint?: "md" | "lg" | "xl"; columnWidths?: readonly string[];
}) {
  const desktop = mobileCards ? mobileBreakpoint === "xl" ? "hidden xl:block" : mobileBreakpoint === "lg" ? "hidden lg:block" : "hidden md:block" : "";
  return <div data-skeleton-table="true" data-skeleton-columns={columns} className="min-w-0">
    {mobileCards && <div className={mobileBreakpoint === "xl" ? "grid gap-3 sm:grid-cols-2 xl:hidden" : mobileBreakpoint === "lg" ? "grid gap-4 p-4 sm:grid-cols-2 lg:hidden" : "space-y-0 md:hidden"}>
      {Array.from({ length: rows }, (_, row) => <div key={row} className="min-w-0 p-4">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0 space-y-2"><SkeletonBlock className="h-5 w-40" /><SkeletonBlock className="h-4 w-32" /><SkeletonBlock className="h-4 w-52" /></div><SkeletonBlock className="h-8 w-8 shrink-0" /></div>
        <div className="mt-3 flex gap-2"><SkeletonBlock className="h-6 w-24" /><SkeletonBlock className="h-6 w-16" /></div>
      </div>)}
    </div>}
    <div className={`overflow-x-auto ${desktop}`}>
      <table aria-hidden="true" className={styles.table} style={{ minWidth, tableLayout: columnWidths ? "fixed" : undefined }}>
        {columnWidths && <colgroup>{columnWidths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>}
        <thead><tr>{Array.from({ length: columns }, (_, column) => <th key={column}><SkeletonBlock className="h-[18px] w-20" /></th>)}</tr></thead>
        <tbody>{Array.from({ length: rows }, (_, row) => <tr key={row} style={{ height: rowHeight }}>
          {Array.from({ length: columns }, (_, column) => <td key={column}>
            <SkeletonBlock className={column === 0 ? "h-[18px] w-32" : "h-[18px] w-20"} />
            {column === 0 && firstColumnLines > 1 && Array.from({ length: firstColumnLines - 1 }, (_, line) => <SkeletonBlock key={line} className="mt-1 h-3 w-24" />)}
          </td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}

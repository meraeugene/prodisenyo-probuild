import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import { SkeletonStats } from "@/components/PageSkeletonParts";
import styles from "./rentalWeeklyReports.module.css";

const COLUMNS = ["Week", "Equipment", "Cash advances", "Salaries", "Total", "Actions"];

export default function GmeaRentalExpensesSkeleton({ canEdit }: { canEdit: boolean }) {
  return <div aria-hidden="true" data-skeleton-panel="true" className="skeleton-surface overflow-hidden">
    <div className="flex flex-wrap gap-2 border-b border-[#e4e7ec] px-[18px] py-[14px]">{["Monthly", "Weekly", "Rentals", "Equipment", "History"].map(label => <div key={label} className="relative px-3 py-2 text-[13px]"><span className="invisible">{label}</span><Block className="absolute inset-0 h-full w-full" /></div>)}</div>
    <div className="space-y-5 p-4 sm:p-5">
      <div className="flex flex-wrap justify-between gap-3"><div><Block className="h-6 w-60" /><Block className="mt-2 h-4 w-96 max-w-full" /></div>{canEdit && <Block className="h-9 w-32" />}</div>
      <div className="flex flex-wrap items-end gap-3"><div><Block className="mb-2 h-4 w-12" /><Block className="h-9 w-44" /></div><Block className="mb-2 h-3 w-52" /></div>
      <SkeletonStats count={2} compact cardClassName="p-4" className="grid gap-3 sm:grid-cols-2" />
      <table aria-hidden="true" className={styles.table}>
        <thead><tr>{COLUMNS.map(label => <th key={label}><Block className="h-4 w-20" /></th>)}</tr></thead>
        <tbody>{Array.from({ length: 5 }, (_, row) => <tr key={row}>
          {COLUMNS.map((label, column) => <td key={label} data-label={label}><Block className={column === 5 ? "h-9 w-24" : column === 0 ? "h-4 w-32" : "h-4 w-24"} /></td>)}
        </tr>)}</tbody>
        <tfoot><tr><td colSpan={4}><Block className="h-4 w-28" /></td><td><Block className="h-4 w-24" /></td><td /></tr></tfoot>
      </table>
    </div>
  </div>;
}

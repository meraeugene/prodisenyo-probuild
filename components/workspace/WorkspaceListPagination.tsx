import TablePagination from "@/components/TablePagination";
import styles from "./workspace.module.css";

export default function WorkspaceListPagination({ page, totalPages, pageSize, total, onPageChange, onPageSizeChange, noun = "records", label }: {
  page: number; totalPages: number; pageSize: number; total: number;
  onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void;
  noun?: string; label: string;
}) {
  return <div className={styles.footer}>
    <p aria-live="polite">{total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} of {total} {noun}</p>
    <div className={styles.pageControls}>
      <label className={styles.pageSize}>Rows per page
        <select aria-label={`${label} rows per page`} value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className={styles.control}>
          {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <TablePagination page={page} totalPages={totalPages} onChange={onPageChange} label={`${label} pages`} appearance="compact" />
    </div>
  </div>;
}

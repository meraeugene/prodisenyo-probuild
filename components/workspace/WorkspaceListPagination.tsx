import TablePagination from "@/components/TablePagination";
import styles from "./workspace.module.css";

export default function WorkspaceListPagination({ page, totalPages, pageSize, total, onPageChange, noun = "records", label }: {
  page: number; totalPages: number; pageSize: number; total: number;
  onPageChange: (page: number) => void;
  noun?: string; label: string;
}) {
  return <div className={styles.footer}>
    <p aria-live="polite">{total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} of {total} {noun}</p>
    <div className={styles.pageControls}>
      <span>{pageSize} rows per page</span>
      <TablePagination page={page} totalPages={totalPages} onChange={onPageChange} label={`${label} pages`} appearance="compact" />
    </div>
  </div>;
}

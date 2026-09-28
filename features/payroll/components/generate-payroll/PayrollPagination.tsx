import { ChevronLeft, ChevronRight } from "lucide-react";

interface PayrollPaginationProps {
  page: number;
  totalPages: number;
  totalRows: number;
  start: number;
  end: number;
  rowLabel: string;
  onPageChange: (page: number) => void;
}

export default function PayrollPagination({ page, totalPages, totalRows, start, end, rowLabel, onPageChange }: PayrollPaginationProps) {
  return (
    <div className="flex flex-col gap-3 px-1 py-3 text-xs text-[#718397] sm:flex-row sm:items-center sm:justify-between">
      <p>Showing {totalRows === 0 ? 0 : start + 1}–{Math.min(end, totalRows)} of {totalRows} {rowLabel}</p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1.5">
          <PageButton label="Previous page" disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))}><ChevronLeft size={15} /></PageButton>
          <span className="px-2 font-semibold text-[#3d536a]">Page {page} of {totalPages}</span>
          <PageButton label="Next page" disabled={page === totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}><ChevronRight size={15} /></PageButton>
        </div>
      ) : null}
    </div>
  );
}

function PageButton({ children, label, disabled, onClick }: { children: React.ReactNode; label: string; disabled: boolean; onClick: () => void }) {
  return <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#d3dfe5] text-[#415a70] transition hover:border-[#82bcb7] disabled:cursor-not-allowed disabled:opacity-35">{children}</button>;
}

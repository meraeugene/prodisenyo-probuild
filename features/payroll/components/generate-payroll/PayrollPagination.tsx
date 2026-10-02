import { PayrollPageControls } from "../PayrollPageControls";

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
      <PayrollPageControls page={page} totalPages={totalPages} onChange={onPageChange} />
    </div>
  );
}

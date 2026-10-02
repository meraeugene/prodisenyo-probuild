import { PayrollPageControls } from "../PayrollPageControls";

export function PayrollDetailPagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return <div className="border-t border-slate-200 px-3 py-2"><PayrollPageControls page={page} totalPages={totalPages} onChange={onChange} label="Employee detail pages" /></div>;
}

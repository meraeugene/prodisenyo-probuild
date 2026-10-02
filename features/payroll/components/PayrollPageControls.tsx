import { ArrowLeft, ArrowRight } from "lucide-react";

export function PayrollPageControls({ page, totalPages, onChange, label = "Payroll pages" }: {
  page: number; totalPages: number; onChange: (page: number) => void; label?: string;
}) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  const buttonClass = "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-600 hover:border-teal-300 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-35";
  return <nav aria-label={label} className="flex flex-wrap items-center justify-end gap-1.5">
    <button type="button" className={buttonClass} disabled={page <= 1} onClick={() => onChange(1)}>First</button>
    <button type="button" className={buttonClass} aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}><ArrowLeft size={16} /></button>
    {start > 1 ? <span className="px-1 text-slate-400">…</span> : null}
    {pages.map((number) => <button key={number} type="button" aria-label={`Page ${number}`} aria-current={page === number ? "page" : undefined} className={`${buttonClass} ${page === number ? "!border-teal-700 !bg-teal-700 !text-white" : ""}`} onClick={() => onChange(number)}>{number}</button>)}
    {pages.at(-1)! < totalPages ? <span className="px-1 text-slate-400">…</span> : null}
    <button type="button" className={buttonClass} aria-label="Next page" disabled={page >= totalPages} onClick={() => onChange(page + 1)}><ArrowRight size={16} /></button>
    <button type="button" className={buttonClass} disabled={page >= totalPages} onClick={() => onChange(totalPages)}>Last</button>
  </nav>;
}

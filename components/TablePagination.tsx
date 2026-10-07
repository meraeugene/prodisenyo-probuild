import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TablePagination({ page, totalPages, onChange, label = "Table pages", appearance = "default" }: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  label?: string;
  appearance?: "default" | "compact";
}) {
  const lastPage = Math.max(1, totalPages);
  const currentPage = Math.max(1, Math.min(page, lastPage));
  const start = Math.max(1, Math.min(currentPage - 2, lastPage - 4));
  const pages = Array.from({ length: Math.min(5, lastPage) }, (_, index) => start + index);
  const compact = appearance === "compact";
  const buttonClass = compact
    ? "inline-flex h-8 min-w-8 items-center justify-center rounded border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
    : "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <button type="button" className={buttonClass} disabled={currentPage === 1} onClick={() => onChange(1)}>First</button>
      <button type="button" className={buttonClass} aria-label="Previous page" disabled={currentPage === 1} onClick={() => onChange(currentPage - 1)}><ChevronLeft size={16} /></button>
      {start > 1 && <span className="px-1 text-slate-400">...</span>}
      {pages.map((number) => (
        <button key={number} type="button" aria-label={`Page ${number}`} aria-current={currentPage === number ? "page" : undefined} className={`${buttonClass} ${currentPage === number ? compact ? "!border-[#076d69] !bg-[#076d69] !text-white" : "!border-teal-700 !bg-teal-700 !text-white" : ""}`} onClick={() => onChange(number)}>{number}</button>
      ))}
      {pages[pages.length - 1] < lastPage && <span className="px-1 text-slate-400">...</span>}
      <button type="button" className={buttonClass} aria-label="Next page" disabled={currentPage === lastPage} onClick={() => onChange(currentPage + 1)}><ChevronRight size={16} /></button>
      <button type="button" className={buttonClass} disabled={currentPage === lastPage} onClick={() => onChange(lastPage)}>Last</button>
    </nav>
  );
}

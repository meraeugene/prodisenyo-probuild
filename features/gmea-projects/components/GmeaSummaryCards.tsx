import { formatMoney, projectSummary } from "../utils/gmeaCalculations";
import type { GmeaProject } from "../types";
import { formatProjectDuration } from "../utils/gmeaFormatters";
import { WalletCards, ReceiptText, TrendingUp, CalendarDays } from "lucide-react";
export default function GmeaSummaryCards({
  project,
}: {
  project: GmeaProject;
}) {
  const s = projectSummary(project);
  const entries = [
    { label: "Contract amount", value: formatMoney(s.contract), icon: WalletCards, tone: "bg-sky-50 text-sky-700" },
    { label: "Total project expenses", value: formatMoney(s.expenses), icon: ReceiptText, tone: "bg-amber-50 text-amber-700" },
    { label: "Total net profit", value: formatMoney(s.profit), icon: TrendingUp, tone: s.profit < 0 ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-700" },
    { label: "Project duration", value: formatProjectDuration(project.duration), icon: CalendarDays, tone: "bg-violet-50 text-violet-700" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {entries.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,.25)] sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={18} aria-hidden="true" /></span>
          </div>
          <p className="mt-4 break-words text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

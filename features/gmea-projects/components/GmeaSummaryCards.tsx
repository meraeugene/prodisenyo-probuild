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
    { label: "Contract amount", value: formatMoney(s.contract), caption: "Total contract value", icon: WalletCards, tone: "text-teal-700" },
    { label: "Total project expenses", value: formatMoney(s.expenses), caption: "Actual expenses to date", icon: ReceiptText, tone: "text-amber-700" },
    { label: "Total net profit", value: formatMoney(s.profit), caption: "Contract amount minus expenses", icon: TrendingUp, tone: s.profit < 0 ? "text-rose-700" : "text-teal-700" },
    { label: "Project duration", value: formatProjectDuration(project.duration), caption: "Project timeline", icon: CalendarDays, tone: "text-violet-700" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {entries.map(({ label, value, caption, icon: Icon, tone }) => (
        <div
          key={label}
          className="min-h-28 min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,.045)]"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2"><Icon size={14} className={`shrink-0 ${tone}`} aria-hidden="true" /><p className="text-sm font-medium text-slate-500">{label}</p></div>
            <p className="mt-1 break-words text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{caption}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

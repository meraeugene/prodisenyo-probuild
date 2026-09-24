import {
  BriefcaseBusiness,
  CircleDollarSign,
  ReceiptText,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { formatOverviewMoney } from "../utils/gmeaOverviewSelectors";

export default function GmeaOverviewSummary({
  summary,
}: {
  summary: {
    activeWork: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    activeClients: number;
  };
}) {
  const cards = [
    [
      "Active projects / rentals",
      summary.activeWork,
      BriefcaseBusiness,
      "text-blue-600",
    ],
    [
      "Total revenue",
      formatOverviewMoney(summary.totalRevenue),
      CircleDollarSign,
      "text-emerald-600",
    ],
    [
      "Total expenses",
      formatOverviewMoney(summary.totalExpenses),
      ReceiptText,
      "text-rose-600",
    ],
    [
      "Net profit / loss",
      formatOverviewMoney(summary.netProfit),
      TrendingUp,
      summary.netProfit < 0 ? "text-rose-600" : "text-emerald-600",
    ],
    ["Active clients", summary.activeClients, UsersRound, "text-sky-600"],
  ] as const;
  return (
    <section
      aria-label="Overview summary"
      className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5"
    >
      {cards.map(([label, value, Icon, tone]) => (
        <article
          key={label}
          className="min-w-0 rounded-[12px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]"
        >
          <div className="flex items-center gap-2">
            <Icon size={14} className={tone} />
            <p className="truncate text-xs font-semibold text-slate-700">
              {label}
            </p>
          </div>
          <p className="mt-2 truncate text-[21px] font-semibold tracking-[-0.035em] text-slate-950 tabular-nums">
            {value}
          </p>
        </article>
      ))}
    </section>
  );
}

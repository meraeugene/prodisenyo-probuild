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
    ],
    [
      "Total revenue",
      formatOverviewMoney(summary.totalRevenue),
    ],
    [
      "Total expenses",
      formatOverviewMoney(summary.totalExpenses),
    ],
    [
      "Net profit / loss",
      formatOverviewMoney(summary.netProfit),
    ],
    ["Active clients", summary.activeClients],
  ] as const;
  return (
    <section
      aria-label="Overview summary"
      className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5"
    >
      {cards.map(([label, value]) => (
        <article
          key={label}
          className="min-w-0 rounded-[12px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]"
        >
          <div className="flex items-center gap-2">
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

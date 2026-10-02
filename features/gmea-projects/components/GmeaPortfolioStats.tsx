import { formatMoney } from "../utils/gmeaCalculations";

export default function GmeaPortfolioStats({
  projectCount,
  contractTotal,
  expenseTotal,
}: {
  projectCount: number;
  contractTotal: number;
  expenseTotal: number;
}) {
  const stats = [
    {
      label: "Active projects",
      value: String(projectCount),
    },
    {
      label: "Contract amount",
      value: formatMoney(contractTotal),
    },
    {
      label: "Total expenses",
      value: formatMoney(expenseTotal),
    },
  ];

  return (
    <section aria-label="Portfolio summary" className="grid gap-3.5 sm:grid-cols-3">
      {stats.map(({ label, value }) => (
        <article key={label} className="min-w-0 rounded-[12px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)] sm:min-h-[84px]">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-semibold text-slate-700">{label}</p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className="truncate text-[21px] font-semibold tracking-[-0.035em] text-slate-950 tabular-nums xl:text-[23px]">{value}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

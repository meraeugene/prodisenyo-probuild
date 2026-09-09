import {
  LuChartNoAxesColumnIncreasing as BarChart3,
  LuBriefcaseBusiness as BriefcaseBusiness,
  LuCoins as Coins,
  LuTrendingUp as TrendingUp,
} from "react-icons/lu";
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
      label: "Projects",
      value: String(projectCount),
      icon: BriefcaseBusiness,
      tone: "bg-[#dcf7f1] text-[#087d76]",
      extra: (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#e7faf4] px-2.5 py-1 text-[11px] font-bold text-[#078266]">
          <TrendingUp size={12} /> +0%
        </span>
      ),
    },
    {
      label: "Contract amount",
      value: formatMoney(contractTotal),
      icon: BarChart3,
      tone: "bg-[#e2f2fe] text-[#1484c7]",
    },
    {
      label: "Total expenses",
      value: formatMoney(expenseTotal),
      icon: Coins,
      tone: "bg-[#fff1d9] text-[#dc8506]",
    },
  ];

  return (
    <section aria-label="Portfolio summary" className="grid gap-3.5 sm:grid-cols-3">
      {stats.map(({ label, value, icon: Icon, tone, extra }) => (
        <article key={label} className="flex min-w-0 items-center gap-4 rounded-[16px] border border-slate-200/75 bg-white px-5 py-4 shadow-[0_12px_32px_-25px_rgba(15,23,42,.32)] sm:min-h-[86px]">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={22} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-medium text-slate-500">{label}</p>
              {extra ?? <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={15} aria-hidden="true" /></span>}
            </div>
            <p className="mt-1 truncate text-[19px] font-bold tracking-[-0.035em] text-slate-950 tabular-nums xl:text-[21px]">{value}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

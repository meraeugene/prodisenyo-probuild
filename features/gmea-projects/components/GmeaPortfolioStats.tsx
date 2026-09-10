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
      tone: "text-[#087d76]",
      extra: (
        <span className="inline-flex items-center gap-1 rounded bg-[#e7faf4] px-2 py-0.5 text-[10px] font-bold text-[#078266]">
          <TrendingUp size={10} /> +0%
        </span>
      ),
    },
    {
      label: "Contract amount",
      value: formatMoney(contractTotal),
      icon: BarChart3,
      tone: "text-[#1484c7]",
    },
    {
      label: "Total expenses",
      value: formatMoney(expenseTotal),
      icon: Coins,
      tone: "text-[#dc8506]",
    },
  ];

  return (
    <section aria-label="Portfolio summary" className="grid gap-3.5 sm:grid-cols-3">
      {stats.map(({ label, value, icon: Icon, tone, extra }) => (
        <article key={label} className="min-w-0 rounded-[12px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)] sm:min-h-[84px]">
          <div className="flex items-center gap-2">
            <Icon size={13} className={`shrink-0 ${tone}`} aria-hidden="true" />
            <p className="truncate text-xs font-semibold text-slate-700">{label}</p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className="truncate text-[21px] font-semibold tracking-[-0.035em] text-slate-950 tabular-nums xl:text-[23px]">{value}</p>
            {extra}
          </div>
        </article>
      ))}
    </section>
  );
}

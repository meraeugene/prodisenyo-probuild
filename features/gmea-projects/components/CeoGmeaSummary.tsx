import {
  LuBriefcaseBusiness as BriefcaseBusiness,
  LuChartNoAxesColumnIncreasing as BarChart3,
  LuCoins as Coins,
  LuLandmark as Landmark,
} from "react-icons/lu";
import { formatMoney } from "../utils/gmeaCalculations";

export default function CeoGmeaSummary({ count, contract, expenses, outstanding }: {
  count: number; contract: number; expenses: number; outstanding: number;
}) {
  const entries = [
    { label: "Projects", value: String(count), icon: BriefcaseBusiness, tone: "text-[#087d76]" },
    { label: "Contract amount", value: formatMoney(contract), icon: BarChart3, tone: "text-[#1484c7]" },
    { label: "Total expenses", value: formatMoney(expenses), icon: Coins, tone: "text-[#dc8506]" },
    { label: "Outstanding collections", value: formatMoney(outstanding), icon: Landmark, tone: "text-[#7047d7]" },
  ];
  return (
    <section aria-label="GMEA portfolio summary" className="grid gap-3.5 sm:grid-cols-2 2xl:grid-cols-4">
      {entries.map(({ label, value, icon: Icon, tone }) => (
        <article key={label} className="min-w-0 rounded-[12px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)] sm:min-h-[84px]">
          <div className="flex items-center gap-2">
            <Icon size={13} className={`shrink-0 ${tone}`} aria-hidden="true" />
            <h2 className="truncate text-xs font-semibold text-slate-700">{label}</h2>
          </div>
          <p className="mt-2 truncate text-[21px] font-semibold tracking-[-0.035em] text-slate-950 tabular-nums xl:text-[23px]">{value}</p>
        </article>
      ))}
    </section>
  );
}

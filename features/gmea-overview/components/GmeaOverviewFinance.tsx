import { BarChart3 } from "lucide-react";
import { formatOverviewMoney } from "../utils/gmeaOverviewSelectors";

type Division = {
  name: "Electronics & Solar" | "Rentals";
  revenue: number;
  expenses: number;
  profit: number;
};

export default function GmeaOverviewFinance({
  divisions,
}: {
  divisions: Division[];
}) {
  const maximum = Math.max(
    1,
    ...divisions.flatMap((division) => [division.revenue, division.expenses]),
  );
  const totalProfit = divisions.reduce(
    (total, division) => total + division.profit,
    0,
  );
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.7fr)]">
      <article className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-[#087d76]" />
          <div>
            <h2 className="text-[16px] font-bold tracking-[-0.025em] text-slate-950">
              Financial Snapshot
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Revenue versus expenses by division.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-5">
          {divisions.map((division) => (
            <div key={division.name}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <strong className="text-slate-800">{division.name}</strong>
                <span className="text-slate-500">
                  {formatOverviewMoney(division.revenue)} revenue
                </span>
              </div>
              <div className="mt-2 grid gap-2">
                <Bar
                  label="Revenue"
                  value={division.revenue}
                  maximum={maximum}
                  tone="bg-blue-500"
                />
                <Bar
                  label="Expenses"
                  value={division.expenses}
                  maximum={maximum}
                  tone="bg-emerald-500"
                />
              </div>
            </div>
          ))}
        </div>
      </article>
      <article className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]">
        <h2 className="text-[16px] font-bold tracking-[-0.025em] text-slate-950">
          Profit Breakdown
        </h2>
        <div className="mt-5 space-y-5">
          {divisions.map((division) => {
            const share =
              totalProfit > 0
                ? Math.max(0, Math.round((division.profit / totalProfit) * 100))
                : 0;
            return (
              <div key={division.name}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-600">{division.name}</span>
                  <strong className="text-slate-900 tabular-nums">
                    {formatOverviewMoney(division.profit)}
                  </strong>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: share + "%" }}
                  />
                </div>
                <p className="mt-1 text-right text-[10px] text-slate-500">
                  {share}% of positive profit
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">Total net profit</p>
          <p
            className={
              "mt-1 text-[24px] font-bold tracking-[-0.04em] tabular-nums " +
              (totalProfit < 0 ? "text-rose-700" : "text-[#087d76]")
            }
          >
            {formatOverviewMoney(totalProfit)}
          </p>
        </div>
      </article>
    </section>
  );
}

function Bar({
  label,
  value,
  maximum,
  tone,
}: {
  label: string;
  value: number;
  maximum: number;
  tone: string;
}) {
  return (
    <div className="grid grid-cols-[58px_1fr_auto] items-center gap-2 text-[10px]">
      <span className="text-slate-500">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={"h-full rounded-full " + tone}
          style={{
            width: Math.max(0, Math.min(100, (value / maximum) * 100)) + "%",
          }}
        />
      </div>
      <strong className="text-slate-700 tabular-nums">
        {formatOverviewMoney(value)}
      </strong>
    </div>
  );
}

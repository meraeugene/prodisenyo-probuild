import Link from "next/link";
import { ArrowRight, FolderKanban, Truck } from "lucide-react";
import { formatOverviewMoney } from "../utils/gmeaOverviewSelectors";

type Division = {
  name: "Electronics & Solar" | "Rentals";
  count: number;
  countLabel: string;
  revenue: number;
  expenses: number;
  profit: number;
  clients: number;
  href: string;
};

export default function GmeaOverviewDivisions({
  divisions,
}: {
  divisions: Division[];
}) {
  return (
    <section aria-labelledby="division-overview-heading">
      <div>
        <h2
          id="division-overview-heading"
          className="text-[20px] font-bold tracking-[-0.035em] text-slate-950"
        >
          Division Overview
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Overall financial totals by division.
        </p>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {divisions.map((division) => {
          const Icon = division.name === "Rentals" ? Truck : FolderKanban;
          return (
            <Link
              key={division.name}
              href={division.href}
              className="group rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)] transition hover:border-teal-200 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#087d76]">
                    <Icon size={19} />
                  </span>
                  <div>
                    <h3 className="text-[17px] font-bold tracking-[-0.025em] text-slate-950">
                      {division.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {division.count} {division.countLabel.toLocaleLowerCase()}{" "}
                      / {division.clients} clients
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#087d76]"
                />
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                <Metric
                  label="Revenue"
                  value={formatOverviewMoney(division.revenue)}
                />
                <Metric
                  label="Expenses"
                  value={formatOverviewMoney(division.expenses)}
                />
                <Metric
                  label="Net profit"
                  value={formatOverviewMoney(division.profit)}
                  tone={
                    division.profit < 0 ? "text-rose-700" : "text-[#087d76]"
                  }
                />
              </dl>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  tone = "text-slate-950",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </dt>
      <dd className={"mt-1 truncate text-sm font-bold tabular-nums " + tone}>
        {value}
      </dd>
    </div>
  );
}

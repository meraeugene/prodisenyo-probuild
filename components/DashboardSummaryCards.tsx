import type { LucideIcon } from "lucide-react";

export type DashboardSummaryCard = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
};

export default function DashboardSummaryCards({
  ariaLabel,
  cards,
  columnsClassName = "2xl:grid-cols-4",
}: {
  ariaLabel: string;
  cards: DashboardSummaryCard[];
  columnsClassName?: string;
}) {
  return (
    <section
      aria-label={ariaLabel}
      className={`grid gap-3 sm:grid-cols-2 ${columnsClassName}`}
    >
      {cards.map(({ label, value, icon: Icon, iconColor }) => (
        <article
          key={label}
          className="min-h-[114px] min-w-0 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-[0_6px_18px_rgba(15,23,42,0.025)]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Icon
              className={`h-4 w-4 shrink-0 ${iconColor}`}
              strokeWidth={1.9}
              aria-hidden="true"
            />
            <h2 className="truncate text-[15px] font-semibold leading-5 text-slate-800">
              {label}
            </h2>
          </div>
          <p className="mt-4 break-words text-[28px] font-bold leading-none tracking-[-0.035em] text-slate-950 tabular-nums">
            {value}
          </p>
        </article>
      ))}
    </section>
  );
}

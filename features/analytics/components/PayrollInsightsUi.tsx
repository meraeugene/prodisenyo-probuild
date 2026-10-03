import type { ReactNode } from "react";
import type { TooltipProps } from "recharts";

type CustomChartTooltipProps = TooltipProps<number, string> & {
  valueFormatter?: (value: number) => string;
  unit?: string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  unit,
}: CustomChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-2xl border border-transparent bg-white px-3 py-2 shadow-workspace">
      {label ? (
        <p className="mb-2 text-[14px] font-semibold text-apple-charcoal">
          {String(label)}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const rawValue =
            typeof entry.value === "number"
              ? entry.value
              : Number(entry.value ?? 0);

          return (
            <div
              key={`${String(entry.dataKey)}-${index}`}
              className="flex items-center gap-2"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: entry.color || "rgb(var(--theme-chart-2))",
                }}
              />
              <span className="text-[12px] text-apple-smoke">
                {String(entry.name || entry.dataKey || "")}
              </span>
              <span className="ml-auto text-[12px] font-semibold text-apple-charcoal">
                {valueFormatter ? valueFormatter(rawValue) : rawValue}
                {unit ? ` ${unit}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartCard({
  title,
  children,
  actions,
  height = "h-[320px]",
  chartHeight,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  height?: string;
  chartHeight?: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[17px] font-semibold tracking-tight text-apple-charcoal">
          {title}
        </h3>
        {actions}
      </div>

      <div
        className={`${height} w-full bg-white py-2`}
        style={chartHeight ? { height: chartHeight } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

export function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-transparent bg-white p-4 shadow-workspace sm:p-5">
      <span className="absolute inset-y-0 left-0 w-1 bg-teal-600" />
      <p className="text-[11px] font-medium text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-950 tabular-nums sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

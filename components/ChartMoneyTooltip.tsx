import type { TooltipProps } from "recharts";

export default function ChartMoneyTooltip({ active, payload, label, formatValue }: TooltipProps<number, string> & {
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="max-w-[280px] rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-slate-900 shadow-workspace">
      <p className="font-bold text-slate-900">{label}</p>
      <dl className="mt-2 space-y-2">
        {payload.map((entry) => (
          <div key={String(entry.dataKey ?? entry.name)} className="flex items-center justify-between gap-4">
            <dt className="text-slate-600">{entry.name}</dt>
            <dd className="font-semibold tabular-nums text-slate-900">{formatValue(entry.value ?? 0)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

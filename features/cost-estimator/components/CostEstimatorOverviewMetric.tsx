export default function CostEstimatorOverviewMetric({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <article className="flex min-h-[126px] items-center gap-5 rounded-[14px] border border-slate-200 bg-white px-7 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div>
        <p className="text-[30px] font-semibold leading-none tracking-[-0.03em] text-teal-950">
          {value}
        </p>
        <p className="mt-2 text-[15px] text-slate-600">{label}</p>
      </div>
    </article>
  );
}

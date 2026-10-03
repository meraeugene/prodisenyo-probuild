export default function CostEstimatorOverviewMetric({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <article className="flex min-h-[126px] items-center gap-5 rounded-[14px] border border-transparent bg-white px-7 py-6 shadow-workspace">
      <div>
        <p className="text-[30px] font-semibold leading-none tracking-[-0.03em] text-teal-950">
          {value}
        </p>
        <p className="mt-2 text-[15px] text-slate-600">{label}</p>
      </div>
    </article>
  );
}

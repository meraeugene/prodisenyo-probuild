import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { GmeaOverviewMetricTotals } from "../types";
import { formatOverviewMetric, GMEA_OVERVIEW_METRICS } from "../utils/gmeaOverviewMetrics";

export default function GmeaOverviewSummary({
  summary,
}: {
  summary: { metrics: GmeaOverviewMetricTotals };
}) {
  return <section aria-label="Overview summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {GMEA_OVERVIEW_METRICS.map((metric) => <Link
      key={metric.id}
      href={`/gmea-overview/${metric.id}`}
      className="workspace-surface group min-w-0 px-5 py-5 transition hover:ring-1 hover:ring-[#076d69] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#076d69]"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[15px] font-medium leading-5 text-[#365b56]">{metric.label}</p>
        <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[#076d69]" />
      </div>
      <p className={`mt-3 break-words text-[30px] font-semibold leading-tight tracking-[-.035em] tabular-nums ${metric.id === "loss" ? "text-rose-700" : metric.id === "profit" ? "text-[#076d69]" : "text-[#1d1d1f]"}`}>
        {formatOverviewMetric(summary.metrics[metric.id], metric.id)}
      </p>
      <p className="mt-2 text-[13px] leading-5 text-[#53736f]">{metric.hint}</p>
    </Link>)}
  </section>;
}

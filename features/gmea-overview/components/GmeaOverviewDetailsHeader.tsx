import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "@/components/workspace/workspace.module.css";
import type { GmeaOverviewMetric } from "../types";
import { formatOverviewMetric, GMEA_OVERVIEW_METRICS } from "../utils/gmeaOverviewMetrics";

export default function GmeaOverviewDetailsHeader({ metric, value, count }: { metric: GmeaOverviewMetric; value: number; count: number }) {
  const definition = GMEA_OVERVIEW_METRICS.find((item) => item.id === metric)!;
  return <>
    <header className="workspace-page-header flex flex-wrap items-start justify-between gap-4 pb-5">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap gap-2 text-xs text-[#53736f]">
          <Link href="/gmea-overview" className="hover:underline focus-visible:outline-teal-700">GMEA overview</Link>
          <span aria-hidden="true">/</span><span aria-current="page">{definition.label}</span>
        </nav>
        <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">{definition.label}</h1>
        <p className="mt-1 text-sm text-[#53736f]">View the records behind this dashboard total.</p>
      </div>
      <Link href="/gmea-overview" className={`${styles.button} sm:mt-9`}><ArrowLeft aria-hidden="true" size={16} />Back to overview</Link>
    </header>
    <section aria-label={`${definition.label} summary`} className="space-y-2 py-1">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className={`text-[32px] font-semibold tracking-tight tabular-nums ${metric === "loss" ? "text-rose-700" : "text-[#076d69]"}`}>{formatOverviewMetric(value, metric)}</p>
        <p className="text-sm text-[#53736f]">{count} {count === 1 ? "record" : "records"}</p>
      </div>
      <p className="max-w-4xl text-[13px] leading-6 text-[#53736f]">{definition.description}</p>
    </section>
  </>;
}

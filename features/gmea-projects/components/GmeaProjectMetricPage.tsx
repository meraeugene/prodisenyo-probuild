"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft } from "lucide-react";
import { getGmeaProjectsDataAction } from "@/actions/gmeaProjects";
import type { GmeaProject } from "../types";
import { buildProjectMetricRecords, buildProjectMetricTotals, formatProjectMetric, PROJECT_METRICS, selectProjectMetricRecords, type ProjectMetric } from "../utils/projectMetrics";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import GmeaProjectMetricTable from "./GmeaProjectMetricTable";
import styles from "@/components/workspace/workspace.module.css";

export default function GmeaProjectMetricPage({ projects, metric, canEdit }: { projects: GmeaProject[]; metric: ProjectMetric; canEdit: boolean }) {
  const { data = projects, error } = useSWR("gmea-projects:list", getGmeaProjectsDataAction, {
    fallbackData: projects, revalidateOnFocus: !canEdit, refreshInterval: canEdit ? 0 : 30000,
  });
  const [query, setQuery] = useState("");
  const records = useMemo(() => buildProjectMetricRecords(data), [data]);
  const totals = useMemo(() => buildProjectMetricTotals(records), [records]);
  const visible = useMemo(() => selectProjectMetricRecords(records, metric, query), [records, metric, query]);
  const filteredTotals = useMemo(() => buildProjectMetricTotals(visible), [visible]);
  const pagination = useTablePagination(visible, JSON.stringify([metric, query]));
  const definition = PROJECT_METRICS.find(item => item.id === metric)!;
  return <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8"><div className="mx-auto max-w-[1440px] space-y-5">
    <header className="workspace-page-header flex flex-wrap items-start justify-between gap-4 pb-5">
      <div><nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap gap-2 text-xs text-[#53736f]"><Link href="/gmea-projects" className="hover:underline">Projects</Link><span aria-hidden="true">/</span><span aria-current="page">{definition.label}</span></nav>
        <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">{definition.label}</h1><p className="mt-1 text-sm text-[#53736f]">Project records behind this total.</p></div>
      <Link href="/gmea-projects" className={`${styles.button} sm:mt-9`}><ArrowLeft aria-hidden="true" size={16} />Back to Projects</Link>
    </header>
    <section aria-label={`${definition.label} summary`} className="space-y-2 py-1"><p className={`text-[32px] font-semibold tracking-tight tabular-nums ${metric === "loss" ? "text-rose-700" : "text-[#076d69]"}`}>{formatProjectMetric(totals[metric], metric)}</p><p className="max-w-4xl text-[13px] leading-6 text-[#53736f]">{definition.description}</p></section>
    {error && <p role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-700">Unable to refresh projects. Please reload to try again.</p>}
    <section className={styles.panel} aria-label="Project metric breakdown">
      <div className={styles.filters}><label className={`${styles.field} ${styles.searchField}`}>Search projects<input data-search-field className={styles.control} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search project, client or location..." /></label><button type="button" className={styles.button} disabled={!query} onClick={() => setQuery("")}>Clear filters</button></div>
      <GmeaProjectMetricTable rows={pagination.pageRows} metric={metric} />
      <p className="border-t border-slate-200 px-5 py-4 text-sm">{query ? "Filtered total" : "Total"} · {visible.length} projects <strong className="ml-3 tabular-nums">{formatProjectMetric(filteredTotals[metric], metric)}</strong></p>
      <WorkspaceListPagination {...pagination} total={visible.length} noun="projects" label="Project details" />
    </section>
  </div></main>;
}

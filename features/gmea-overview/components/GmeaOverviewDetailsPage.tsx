"use client";

import styles from "@/components/workspace/workspace.module.css";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import type { GmeaOverviewData, GmeaOverviewMetric } from "../types";
import { useGmeaOverviewDetails } from "../hooks/useGmeaOverviewDetails";
import GmeaOverviewDetailsHeader from "./GmeaOverviewDetailsHeader";
import GmeaOverviewDetailsTable from "./GmeaOverviewDetailsTable";

export default function GmeaOverviewDetailsPage({ initialData, metric, canEdit }: { initialData: GmeaOverviewData; metric: GmeaOverviewMetric; canEdit: boolean }) {
  const view = useGmeaOverviewDetails(initialData, metric, canEdit);
  const { pagination } = view;
  return <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8"><div className="mx-auto max-w-[1440px] space-y-5">
    <GmeaOverviewDetailsHeader metric={metric} value={view.totals[metric]} count={view.count} />
    <section className={styles.panel} aria-label="Metric breakdown">
      <div className={styles.filters}>
        <label className={`${styles.field} ${styles.searchField}`}>Search records
          <input data-search-field className={styles.control} type="search" value={view.query} onChange={(event) => view.setQuery(event.target.value)} placeholder="Search project, rental or client..." />
        </label>
        <label className={styles.field}>Division
          <select className={styles.control} value={view.division} onChange={(event) => view.setDivision(event.target.value)}>
            <option value="all">All divisions</option><option value="Projects Expenses">Projects Expenses</option><option value="Rentals">Rentals</option>
          </select>
        </label>
        <button type="button" className={styles.button} disabled={!view.hasFilters} onClick={view.reset}>Clear filters</button>
      </div>
      <GmeaOverviewDetailsTable rows={pagination.pageRows} metric={metric} filteredTotal={view.filteredTotals[metric]} filteredCount={view.visible.length} hasFilters={view.hasFilters} />
      <WorkspaceListPagination {...pagination} total={view.visible.length} label="GMEA details" />
    </section>
  </div></main>;
}

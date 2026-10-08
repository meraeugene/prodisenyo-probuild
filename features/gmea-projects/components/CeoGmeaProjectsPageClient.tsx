"use client";

import CeoListPagination from "@/features/ceo-workspace/components/CeoListPagination";
import CeoPageHeader from "@/features/ceo-workspace/components/CeoPageHeader";
import styles from "@/components/workspace/workspace.module.css";
import { useCeoGmeaPortfolio } from "../hooks/useCeoGmeaPortfolio";
import type { GmeaProject } from "../types";
import CeoGmeaProjectFilters from "./CeoGmeaProjectFilters";
import CeoGmeaCharts from "./CeoGmeaCharts";
import CeoGmeaProjectsTable from "./CeoGmeaProjectsTable";
import CeoGmeaSummary from "./CeoGmeaSummary";

export default function CeoGmeaProjectsPageClient({ projects }: { projects: GmeaProject[] }) {
  const portfolio = useCeoGmeaPortfolio(projects);
  return <div className="min-h-screen bg-[#f5f6f8] p-4 sm:p-6">
    <div className="mx-auto max-w-[1600px] space-y-5">
      <CeoPageHeader eyebrow="GMEA / Projects Expenses" title="Project portfolio" description="Review contracts, project expenses, and outstanding collections." />
      <CeoGmeaSummary count={portfolio.portfolioProjects.length} contract={portfolio.data.contract} expenses={portfolio.data.expenses} outstanding={portfolio.data.outstanding} trend={portfolio.data.trend} />
      <CeoGmeaCharts data={portfolio.data} count={portfolio.portfolioProjects.length} months={portfolio.months} onMonthsChange={portfolio.setMonths} />
      <section aria-label="Projects" className={styles.panel}>
        <CeoGmeaProjectFilters tab={portfolio.tab} tabCounts={portfolio.tabCounts} query={portfolio.query} filter={portfolio.filter} sort={portfolio.sort} clients={portfolio.clients}
          onTabChange={portfolio.setTab} onQueryChange={portfolio.setQuery} onFilterChange={portfolio.setFilter} onSortChange={portfolio.changeSort} hasFilters={portfolio.hasFilters} onReset={portfolio.reset} />
        <CeoGmeaProjectsTable projects={portfolio.pagination.pageRows} totalProjects={portfolio.visible} sort={portfolio.sort} direction={portfolio.direction} onSort={portfolio.toggleSort} />
        <CeoListPagination {...portfolio.pagination} total={portfolio.visible.length} noun="projects" label="GMEA project table" />
      </section>
    </div>
  </div>;
}

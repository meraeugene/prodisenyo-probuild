import CeoListToolbar from "@/features/ceo-workspace/components/CeoListToolbar";
import styles from "@/features/ceo-workspace/components/ceoWorkspace.module.css";
import { CEO_PROJECT_TABS, type CeoProjectTab } from "../utils/ceoProjectFilters";
import type { CeoGmeaSort } from "../utils/ceoPortfolioSorting";

export default function CeoGmeaProjectFilters({ tab, tabCounts, query, filter, sort, clients, onTabChange, onQueryChange, onFilterChange, onSortChange, hasFilters, onReset }: {
  tab: CeoProjectTab; tabCounts: Record<CeoProjectTab, number>; query: string; filter: string; sort: CeoGmeaSort; clients: string[];
  onTabChange: (tab: CeoProjectTab) => void; onQueryChange: (query: string) => void; onFilterChange: (filter: string) => void; onSortChange: (sort: CeoGmeaSort) => void;
  hasFilters: boolean; onReset: () => void;
}) {
  return <CeoListToolbar tabs={CEO_PROJECT_TABS.map((name) => ({ value: name, label: name, count: tabCounts[name] }))} tab={tab} onTabChange={onTabChange}
    query={query} onQueryChange={onQueryChange} searchLabel="Search projects" placeholder="Project, client, or location" hasFilters={hasFilters} onReset={onReset}>
    <label className={styles.field}>Client / expense filter
      <select aria-label="Filter projects" value={filter} onChange={(event) => onFilterChange(event.target.value)} className={styles.control}>
        <option value="all">All clients</option>{clients.map((client) => <option key={client} value={`client:${client}`}>{client}</option>)}
        <option value="new">Unread expenses</option><option value="over-contract">Expenses over contract</option>
      </select>
    </label>
    <label className={styles.field}>Sort by
      <select aria-label="Sort projects" value={sort} onChange={(event) => onSortChange(event.target.value as CeoGmeaSort)} className={styles.control}>
        <option value="latest">Date created</option><option value="name">Project name</option><option value="contract">Contract amount</option>
        <option value="expenses">Total expenses</option><option value="collected">Collected amount</option><option value="outstanding">Outstanding</option>
      </select>
    </label>
  </CeoListToolbar>;
}

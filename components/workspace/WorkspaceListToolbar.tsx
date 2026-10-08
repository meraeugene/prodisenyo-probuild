import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import styles from "./workspace.module.css";
import WorkspaceTabSwitch, { type WorkspaceTabItem } from "./WorkspaceTabSwitch";

export default function WorkspaceListToolbar<T extends string>({ tabs, tab, onTabChange, query, onQueryChange, searchLabel, placeholder, children, hasFilters, onReset }: {
  tabs: readonly WorkspaceTabItem<T>[];
  tab: T; onTabChange: (value: T) => void;
  query: string; onQueryChange: (value: string) => void;
  searchLabel: string; placeholder: string; children?: ReactNode;
  hasFilters: boolean; onReset: () => void;
}) {
  return <div className={styles.toolbar}>
    <WorkspaceTabSwitch label="Filter by status" mode="filter" items={tabs} value={tab} onChange={onTabChange} className={styles.filterTabs} />
    <div className={styles.filters}>
      <label className={`${styles.field} ${styles.searchField}`}>
        <span>{searchLabel}</span>
        <input type="search" data-search-field="true" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={placeholder} className={styles.control} />
      </label>
      {children}
      <button type="button" onClick={onReset} disabled={!hasFilters} className={`${styles.button} ${styles.reset}`}><RotateCcw size={14} aria-hidden="true" />Reset filters</button>
    </div>
  </div>;
}

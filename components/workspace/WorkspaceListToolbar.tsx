import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import styles from "./workspace.module.css";
import WorkspaceTabSwitch, { type WorkspaceTabItem } from "./WorkspaceTabSwitch";
import WorkspaceSearchInput from "./WorkspaceSearchInput";

export default function WorkspaceListToolbar<T extends string>({ tabs, tab, onTabChange, query, onQueryChange, searchLabel, placeholder, children, hasFilters, onReset, tabsLabel = "Filter by status", filtersClassName = "" }: {
  tabs: readonly WorkspaceTabItem<T>[];
  tab: T; onTabChange: (value: T) => void;
  query: string; onQueryChange: (value: string) => void;
  searchLabel: string; placeholder: string; children?: ReactNode;
  hasFilters: boolean; onReset: () => void;
  tabsLabel?: string;
  filtersClassName?: string;
}) {
  return <div className={styles.toolbar}>
    <WorkspaceTabSwitch label={tabsLabel} mode="filter" items={tabs} value={tab} onChange={onTabChange} className={styles.filterTabs} />
    <div className={`${styles.filters} ${filtersClassName}`}>
      <label className={`${styles.field} ${styles.searchField}`}>
        <span>{searchLabel}</span>
        <WorkspaceSearchInput value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={placeholder} />
      </label>
      {children}
      <button type="button" onClick={onReset} disabled={!hasFilters} className={`${styles.button} ${styles.reset}`}><RotateCcw size={14} aria-hidden="true" />Reset filters</button>
    </div>
  </div>;
}

import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import styles from "./ceoWorkspace.module.css";

export default function CeoListToolbar<T extends string>({ tabs, tab, onTabChange, query, onQueryChange, searchLabel, placeholder, children, hasFilters, onReset }: {
  tabs: readonly { value: T; label: string; count: number }[];
  tab: T; onTabChange: (value: T) => void;
  query: string; onQueryChange: (value: string) => void;
  searchLabel: string; placeholder: string; children?: ReactNode;
  hasFilters: boolean; onReset: () => void;
}) {
  return <div className={styles.toolbar}>
    <nav aria-label="Filter by status" className={styles.tabs}>
      {tabs.map((item) => <button key={item.value} type="button" aria-pressed={tab === item.value} onClick={() => onTabChange(item.value)} className={styles.tab}>
        {item.label}<span className={styles.count}>{item.count}</span>
      </button>)}
    </nav>
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

import WorkspaceListToolbar from "@/components/workspace/WorkspaceListToolbar";
import type { usePayrollReportFilters } from "../hooks/usePayrollReportFilters";
import styles from "@/components/workspace/workspace.module.css";

export default function PayrollReportFilters({ state }: { state: ReturnType<typeof usePayrollReportFilters> }) {
  return <WorkspaceListToolbar tabs={state.tabs} tab={state.status} onTabChange={state.setStatus}
    query={state.query} onQueryChange={state.setQuery} searchLabel="Search payroll reports" placeholder="Search payroll runs, site, or period"
    hasFilters={state.hasFilters} onReset={state.reset}>
    <label className={styles.field}>Payroll period<select aria-label="Filter payroll period" value={state.period} onChange={event => state.setPeriod(event.target.value)} className={styles.control}>
      <option value="all">All periods</option>{state.periods.map(period => <option key={period} value={period}>{period}</option>)}
    </select></label>
    <label className={styles.field}>Project site<select value={state.site} onChange={event => state.setSite(event.target.value)} className={styles.control}>
      <option value="all">All sites</option>{state.sites.map(site => <option key={site} value={site}>{site}</option>)}
    </select></label>
    <label className={styles.field}>Sort payroll reports<select value={state.sort} onChange={event => state.setSort(event.target.value)} className={styles.control}>
      <option value="latest">Latest submitted</option><option value="value">Highest net payroll</option>
    </select></label>
  </WorkspaceListToolbar>;
}

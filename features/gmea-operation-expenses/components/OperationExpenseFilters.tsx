"use client";
import WorkspaceListToolbar from "@/components/workspace/WorkspaceListToolbar";
import { OPERATION_EXPENSE_CATEGORIES } from "../types";
import type { useOperationExpensesPage } from "../hooks/useOperationExpensesPage";
import styles from "@/components/workspace/workspace.module.css";

export default function OperationExpenseFilters({ state }: { state: ReturnType<typeof useOperationExpensesPage> }) {
  return <WorkspaceListToolbar tabsLabel="Operation expense reporting period" tabs={[{ value: "all", label: "All" }, { value: "month", label: "Monthly" }, { value: "week", label: "Weekly" }]}
    tab={state.period} onTabChange={state.setPeriod} query={state.query} onQueryChange={state.setQuery}
    searchLabel="Search operation expenses" placeholder="Description, payee, or reference" hasFilters={state.hasFilters} onReset={state.resetFilters}>
    {state.period !== "all" && <label className={styles.field}>{state.period === "month" ? "Month" : "Date in week"}<input className={styles.control}
      aria-label={state.period === "month" ? "Operation expense month" : "Date in operation expense week"}
      type={state.period === "month" ? "month" : "date"} value={state.period === "month" ? state.anchor.slice(0, 7) : state.anchor}
      onChange={event => state.setAnchor(state.period === "month" ? event.target.value ? `${event.target.value}-01` : "" : event.target.value)} /></label>}
    <label className={styles.field}>Filter expenses<select aria-label="Operation expense category" className={styles.control} value={state.category} onChange={event => state.setCategory(event.target.value)}><option value="">All categories</option>{OPERATION_EXPENSE_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label>
  </WorkspaceListToolbar>;
}

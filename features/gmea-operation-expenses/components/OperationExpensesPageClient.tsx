"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useGmeaCacheRefresh } from "@/features/gmea-forms/hooks/useGmeaCacheRefresh";
import { deleteGmeaOperationExpenseAction } from "@/actions/gmeaOperationExpenses";
import GmeaDeleteRecordDialog from "@/features/gmea-forms/components/GmeaDeleteRecordDialog";
import DashboardPageHero from "@/components/DashboardPageHero";
import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import type { OperationExpense } from "../types";
import { useOperationExpensesPage } from "../hooks/useOperationExpensesPage";
import { formatRentalDate, formatRentalMoney } from "@/features/gmea-rentals/utils/rentalUi";
import OperationExpensesTable from "./OperationExpensesTable";
import OperationExpenseForm from "./OperationExpenseForm";
import OperationExpenseCharts from "./OperationExpenseCharts";
import OperationExpenseFilters from "./OperationExpenseFilters";
import styles from "@/components/workspace/workspace.module.css";

export default function OperationExpensesPageClient({ initialExpenses, canEdit }: { initialExpenses: OperationExpense[]; canEdit: boolean }) {
  const state = useOperationExpensesPage(initialExpenses);
  const refresh = useGmeaCacheRefresh();
  const [deleting, setDeleting] = useState<OperationExpense>();
  async function deleteExpense() {
    if (!deleting || !canEdit) return;
    await deleteGmeaOperationExpenseAction(deleting.id, deleting.version);
    await state.removeExpense(deleting.id);
    refresh(["gmea-dashboard:overview"]);
  }
  return <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8"><div className="mx-auto max-w-[1440px] space-y-4">
    <DashboardPageHero eyebrow="GMEA" title="Operation Expenses" description="Transportation, water, salary, and electricity spending."
      actions={canEdit && <button type="button" className={styles.primaryButton} onClick={() => state.setEditor(null)}><Plus size={16} aria-hidden="true" />New operation expense</button>} />
    {state.error && <p role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-700">Unable to refresh operation expenses. Reload to try again.</p>}
    <WorkspaceTabSwitch label="Operation expense views" value={state.view} onChange={state.setView}
      items={[{ value: "records", label: "Expenses" }, { value: "analytics", label: "Analytics" }]} />
      <WorkspaceSummaryCards ariaLabel="Operation expense totals" className="lg:grid-cols-3 xl:grid-cols-5" cards={[
        { label: "Total expenses", value: formatRentalMoney(state.summary.total) },
        ...state.summary.categories.map(row => ({ label: row.category, value: formatRentalMoney(row.amount) })),
      ]} />
    <section aria-label="Operation expense reporting" className={styles.panel}>
      <OperationExpenseFilters state={state} />
      {state.range && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{formatRentalDate(state.range.start)} – {formatRentalDate(state.range.end)}</p>}
      {!state.range && <p role="alert" className="px-5 py-3 text-sm text-rose-700">Choose a valid reporting period.</p>}
      {state.view === "analytics" ? <OperationExpenseCharts trend={state.trend} summary={state.summary} period={state.period} /> : <>
        <OperationExpensesTable expenses={state.pagination.pageRows} canEdit={canEdit} onOpen={state.setEditor} onDelete={setDeleting} />
        <WorkspaceListPagination {...state.pagination} total={state.visible.length} noun="expenses" label="Operation expenses" />
      </>}
    </section>
  </div>{state.editor !== undefined && <OperationExpenseForm expense={state.editor ?? undefined} readOnly={!canEdit} onSaved={state.revealSavedExpense} onClose={() => state.setEditor(undefined)} />}
  {deleting && canEdit && <GmeaDeleteRecordDialog title="Delete operation expense?" description={`Delete ${deleting.description} (${formatRentalMoney(deleting.amount)})? Expense totals will be updated.`} onDelete={deleteExpense} onClose={() => setDeleting(undefined)} successMessage="Operation expense deleted successfully." />}</main>;
}

"use client";
import { useState } from "react";
import type { RentalIncomeRecord } from "../incomeTypes";
import type { GmeaRental, RentalExpense, RentalOperationsData } from "../types";
import type { useRentalTransactions } from "../hooks/useRentalTransactions";
import type { RentalIncomeTab } from "../utils/rentalWorkbookRecords";
import WorkspaceListToolbar from "@/components/workspace/WorkspaceListToolbar";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import GmeaRentalTransactionsTable from "./GmeaRentalTransactionsTable";
import GmeaRentalIncomePaymentHistory from "./GmeaRentalIncomePaymentHistory";
import GmeaRentalExpenseForm from "./GmeaRentalExpenseForm";
import GmeaCustomerIncomeForm from "./GmeaCustomerIncomeForm";
import GmeaRentalExpenseWeeks from "./GmeaRentalExpenseWeeks";
import styles from "@/components/workspace/workspace.module.css";
import filterStyles from "./rentalTransactionFilters.module.css";

export default function GmeaRentalTransactions({ state, operations, rentals, canEdit, onLocation }: {
  state: ReturnType<typeof useRentalTransactions>; operations: RentalOperationsData; rentals: GmeaRental[]; canEdit: boolean;
  onLocation?: (record: RentalIncomeRecord) => void;
}) {
  const [selected, setSelected] = useState<RentalIncomeRecord | null>(null), [expense, setExpense] = useState<RentalExpense | undefined>();
  const [paymentRecord, setPaymentRecord] = useState<RentalIncomeRecord | undefined>();
  return <section aria-label="Rental records" className={styles.panel}>
    <h2 className="px-5 pt-5 text-lg font-semibold">Income and expenses</h2>
    <WorkspaceListToolbar tabsLabel="Rental record type" tabs={[
      { value: "all", label: "All records", count: state.rows.length }, { value: "income", label: "Income" }, { value: "expense", label: "Expense" },
    ]} tab={state.type} onTabChange={state.changeType} query={state.query} onQueryChange={state.setQuery} searchLabel="Search rental records"
      placeholder="Company, location, rental service, or payment method" hasFilters={state.hasFilters} onReset={state.reset} filtersClassName={filterStyles.filters}>
      <label className={styles.field}>Company<select aria-label="Filter rental records by company" className={styles.control} value={state.client} onChange={event => state.setClient(event.target.value)}><option value="">All companies</option>{state.clientOptions.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
      <label className={styles.field}>Location<select aria-label="Filter rental records by location" className={styles.control} value={state.location} onChange={event => state.setLocation(event.target.value)}><option value="">All locations</option>{state.locationOptions.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
      <label className={styles.field}>Month<select aria-label="Filter rental records by month" className={styles.control} value={state.month} onChange={event => state.setMonth(event.target.value)}><option value="">All months</option>{state.monthOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      {state.type === "expense" && <label className={`${styles.field} ${filterStyles.weekRange}`}>Week range<select aria-label="Select expense week range" className={styles.control} value={state.expensePages.selected?.id || ""} disabled={!state.expensePages.selected} onChange={event => state.expensePages.select(event.target.value)}>{state.expensePages.pages.length ? state.expensePages.pages.map(page => <option key={page.id} value={page.id}>{page.label}</option>) : <option value="">No matching weeks</option>}</select></label>}
      {state.type !== "expense" && <label className={styles.field}>Payment type<select aria-label="Filter rental records by payment type" className={styles.control} value={state.paymentType} onChange={event => state.setPaymentType(event.target.value as RentalIncomeTab)}><option value="all">All payments</option><option value="down_payment">Down payments</option><option value="full_payment">Full payments</option><option value="other">Other / unrecorded</option></select></label>}
    </WorkspaceListToolbar>
    {state.type === "expense" ? <GmeaRentalExpenseWeeks state={state.expensePages} onExpense={setExpense} onLocation={onLocation} /> : <>
      <GmeaRentalTransactionsTable rows={state.pagination.pageRows} expenseOnly={false} onHistory={setSelected} onExpense={setExpense} onLocation={onLocation} />
      <WorkspaceListPagination {...state.pagination} total={state.visible.length} noun="records" label="Rental records" />
    </>}
    {selected && <GmeaRentalIncomePaymentHistory rental={selected} onClose={() => setSelected(null)}
      onAddPayment={canEdit && selected.customerIncome ? () => { setPaymentRecord(selected); setSelected(null); } : undefined} />}
    {paymentRecord && <GmeaCustomerIncomeForm record={paymentRecord} onClose={() => setPaymentRecord(undefined)} />}
    {expense && <GmeaRentalExpenseForm expense={expense} rental={rentals.find(row => row.id === expense.rental_id)} equipment={operations.equipment} categories={operations.categories} allowReportingCutoff readOnly={!canEdit} onClose={() => setExpense(undefined)} />}
  </section>;
}

"use client";

import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";
import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import type { RentalIncomePageState } from "../hooks/useRentalIncomePage";
import { formatRentalMoney } from "../utils/rentalUi";
import GmeaRentalIncomeCompaniesTable from "./GmeaRentalIncomeCompaniesTable";
import GmeaRentalIncomeTransactionsTable from "./GmeaRentalIncomeTransactionsTable";
import GmeaRentalIncomeReview from "./GmeaRentalIncomeReview";
import styles from "@/components/workspace/workspace.module.css";

export default function GmeaRentalIncomeWorkspace({ state }: { state: RentalIncomePageState }) {
  const { view, month, query, company, summary } = state;
  const companies = state.companies;
  const companyPagination = useTablePagination(companies, JSON.stringify([view, month, query, company]));
  const transactionRentals = [...new Map(state.transactions.map(row => [row.rental.id, row.rental])).values()];
  const transactionPagination = useTablePagination(transactionRentals, JSON.stringify([view, month, query, company]));
  const pageIds = new Set(transactionPagination.pageRows.map(rental => rental.id));
  const validMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
  return <section aria-label="Rental income workspace" className="space-y-4 p-4 sm:p-5">
    <WorkspaceTabSwitch label="Rental income views" value={view} onChange={state.setView}
      items={[{ value: "monthly", label: "Monthly Overview" }, { value: "companies", label: "Companies" }, { value: "transactions", label: "Transactions" }, {value:"review",label:"Needs review",count:state.reviewRecords.length}]} />
    <header><h2 className="text-lg font-semibold">{view === "review" ? "Rental income entries needing review" : view === "monthly" ? "Monthly rental income" : view === "companies" ? "Rental companies and clients" : "Rental income transactions"}</h2>
      <p className="mt-1 text-sm text-slate-500">Payments received in the selected month, with separate down payments and full or final payments.</p></header>
    <div className="flex flex-wrap items-end gap-3">
      <label className={styles.field}>Income month<input aria-label="Income month" type="month" className={styles.control} value={month} onChange={event => state.setMonth(event.target.value)} /></label>
      <label className={`${styles.field} ${styles.searchField}`}>Search income<input type="search" className={styles.control} value={query}
        onChange={event => state.setQuery(event.target.value)} placeholder="Company, rental, location, or equipment" /></label>
      <label className={styles.field}>Company / Client<select className={styles.control} value={company} onChange={event => state.setCompany(event.target.value)}>
        <option value="">All companies and clients</option>{state.companyOptions.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
      </select></label>
      <button type="button" className={styles.button} disabled={!query && !company} onClick={() => { state.setQuery(""); state.setCompany(""); }}>Clear income filters</button>
    </div>
    {view === "review" ? <GmeaRentalIncomeReview records={state.reviewRecords} filterKey={JSON.stringify([query,company])} /> : !validMonth ? <p role="alert" className="text-sm text-rose-700">Choose a valid income month.</p> : <>
      <WorkspaceSummaryCards ariaLabel="Monthly rental income totals" cards={[
        { label: "Total collected", value: formatRentalMoney(summary.collected), hint: `${summary.companies} companies / clients paid this month` },
        { label: "Down Payment collected", value: formatRentalMoney(summary.downPayment) },
        { label: "Full Payment collected", value: formatRentalMoney(summary.fullPayment) },
        { label: "Outstanding at month-end", value: formatRentalMoney(state.outstanding), hint: "Confirmed rental charges only" },
      ]} />
      <p className="text-xs text-slate-500">Other collections: {formatRentalMoney(summary.otherPayments)}. Balances use currently posted receipts through month-end.</p>
      {state.unconfirmedBalances > 0 && <p role="status" className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{state.unconfirmedBalances} historical charges are unconfirmed and excluded from outstanding balances. See Needs review for the original entries.</p>}
      {summary.unclassifiedCount > 0 && <p role="status" className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        {summary.unclassifiedCount} {summary.unclassifiedCount === 1 ? "receipt has" : "receipts have"} no payment type. {summary.unclassifiedCount === 1 ? "It is" : "They are"} included in total and other collections.
      </p>}
      {view === "transactions" || view === "monthly" ? <>
        <GmeaRentalIncomeTransactionsTable transactions={state.transactions.filter(row => pageIds.has(row.rental.id))} />
        <WorkspaceListPagination {...transactionPagination} total={transactionRentals.length} noun="rentals" label="Rental income transactions" />
      </> : <>
        <p className="text-sm text-slate-500">All matching companies and clients, including those with no collections this month. Select a name to view payments.</p>
        <GmeaRentalIncomeCompaniesTable companies={companyPagination.pageRows} onOpenCompany={state.openCompany} />
        <WorkspaceListPagination {...companyPagination} total={companies.length} noun="companies / clients" label="Rental income companies" />
      </>}
    </>}
  </section>;
}

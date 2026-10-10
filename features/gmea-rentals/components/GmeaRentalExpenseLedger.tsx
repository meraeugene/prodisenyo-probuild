"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { GmeaRental, RentalExpense, RentalOperationsData } from "../types";
import { latestRentalExpenseDate, rentalExpensePeriodRange, selectRentalExpenseRows, summarizeRentalExpenses, type RentalExpensePeriod } from "../utils/rentalExpensePeriods";
import { formatRentalDate, formatRentalMoney } from "../utils/rentalUi";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import GmeaRentalExpenseLedgerTable from "./GmeaRentalExpenseLedgerTable";
import GmeaRentalExpenseForm from "./GmeaRentalExpenseForm";
import styles from "@/components/workspace/workspace.module.css";

export default function GmeaRentalExpenseLedger({ operations, rentals, canEdit, initialPeriod = "month", showPeriodTabs = true, historical = false }: { operations: RentalOperationsData; rentals: GmeaRental[]; canEdit: boolean; initialPeriod?: RentalExpensePeriod; showPeriodTabs?: boolean; historical?: boolean }) {
  const [period, setPeriod] = useState<RentalExpensePeriod>(initialPeriod);
  const [anchor, setAnchor] = useState(() => latestRentalExpenseDate(operations.expenses, new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })));
  const [query, setQuery] = useState(""), [category, setCategory] = useState(""), [equipment, setEquipment] = useState("");
  const [editor, setEditor] = useState<RentalExpense | null | undefined>();
  const equipmentNames = useMemo(() => new Map(operations.equipment.map(item => [item.id, item.name])), [operations.equipment]);
  const categories = useMemo(() => new Map(operations.categories.map(item => [item.id, item.name])), [operations.categories]);
  const range = useMemo(() => rentalExpensePeriodRange(period, anchor), [period, anchor]);
  const validPeriod = period === "all" || !!range;
  const visible = useMemo(() => validPeriod ? selectRentalExpenseRows(operations.expenses, range, query, category, equipment, equipmentNames) : [], [operations.expenses, range, validPeriod, query, category, equipment, equipmentNames]);
  const totals = summarizeRentalExpenses(visible);
  const pagination = useTablePagination(visible, JSON.stringify([period, anchor, query, category, equipment]));
  return <section aria-label="Rental expenses" className="space-y-4 p-4 sm:p-5">
    <header className="flex flex-wrap justify-between gap-3"><div><h2 className="text-lg font-semibold">{historical ? "Expense history" : period === "month" ? "Monthly rental expenses" : period === "week" ? "Weekly rental expenses" : "Rental expenses"}</h2><p className="mt-1 text-sm text-slate-500">{historical ? "All recorded expenses by transaction date. Use Monthly and Weekly for cutoff reports." : "Equipment and operating costs grouped by expense date. Weekly periods run Monday–Sunday."}</p></div>{canEdit && !historical && <button type="button" className={styles.primaryButton} onClick={() => setEditor(null)}><Plus size={16} aria-hidden="true" />New expense</button>}</header>
    <div className="flex flex-wrap items-end gap-3">{showPeriodTabs && <WorkspaceTabSwitch label="Expense reporting period" items={historical ? [{ value: "month", label: "By month" }, { value: "all", label: "All dates" }] : [{ value: "month", label: "Monthly" }, { value: "week", label: "Weekly" }, { value: "all", label: "All dates" }]} value={period} onChange={setPeriod} />}
      {period !== "all" && <label className={styles.field}>{period === "month" ? "Month" : "Date in week"}<input aria-label={period === "month" ? "Expense month" : "Date in expense week"} type={period === "month" ? "month" : "date"} className={styles.control} value={period === "month" ? anchor.slice(0, 7) : anchor} onChange={event => setAnchor(period === "month" ? event.target.value ? `${event.target.value}-01` : "" : event.target.value)} /></label>}
      {range && <p className="pb-2 text-xs text-slate-500">{formatRentalDate(range.start)} – {formatRentalDate(range.end)}</p>}
    </div>
    {!validPeriod && <p role="alert" className="text-sm text-rose-700">Choose a valid reporting period.</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Total expenses", totals.gross], ["Input VAT", totals.vat], ["Refunded", totals.refunded], ["Net expenses", totals.net]].map(([label, value]) => <div key={label} className="min-w-0 rounded border border-slate-200 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 break-words text-xl font-semibold tabular-nums">{formatRentalMoney(Number(value))}</p></div>)}</div>
    <div className="flex flex-wrap items-end gap-3"><label className={`${styles.field} ${styles.searchField}`}>Search expenses<input data-search-field type="search" className={styles.control} value={query} onChange={event => setQuery(event.target.value)} placeholder="Description, equipment, supplier, or invoice" /></label>
      <label className={styles.field}>Category<select className={styles.control} value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{operations.categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className={styles.field}>Equipment<select className={styles.control} value={equipment} onChange={event => setEquipment(event.target.value)}><option value="">All equipment and general costs</option><option value="general">No equipment assigned</option>{operations.equipment.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button type="button" className={styles.button} disabled={!query && !category && !equipment} onClick={() => { setQuery(""); setCategory(""); setEquipment(""); }}>Clear filters</button>
    </div>
    <GmeaRentalExpenseLedgerTable expenses={pagination.pageRows} categories={categories} equipment={equipmentNames} onDetails={setEditor} canEdit={canEdit} />
    <WorkspaceListPagination {...pagination} total={visible.length} noun="expenses" label="Rental expense ledger" />
    {editor !== undefined && <GmeaRentalExpenseForm rental={rentals.find(item => item.id === editor?.rental_id)} equipment={operations.equipment} categories={operations.categories} expense={editor ?? undefined} readOnly={!canEdit} onClose={() => setEditor(undefined)} />}
  </section>;
}

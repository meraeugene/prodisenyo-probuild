import TablePagination from "@/components/TablePagination";
import type { RentalExpense } from "../types";
import type { RentalIncomeRecord } from "../incomeTypes";
import type { useRentalExpensePages } from "../hooks/useRentalExpensePages";
import { formatRentalMoney } from "../utils/rentalUi";
import { sumRentalWorkbookExpenses } from "../utils/rentalWorkbookTable";
import GmeaRentalTransactionsTable from "./GmeaRentalTransactionsTable";
import workspace from "@/components/workspace/workspace.module.css";

export default function GmeaRentalExpenseWeeks({ state, onExpense, onLocation }: {
  state: ReturnType<typeof useRentalExpensePages>; onExpense: (expense: RentalExpense) => void;
  onLocation?: (record: RentalIncomeRecord) => void;
}) {
  const { selected, index, pages, pageRows } = state;
  if (!selected) return <p role="status" className={workspace.empty}>No rental expenses for this month or these filters.</p>;
  return <article aria-label={selected.week ? `Week ${selected.week.start} to ${selected.week.end}` : "Other recorded rental expenses"}>
    <header className={workspace.sectionHeader}>
      <h3 className={workspace.sectionTitle}>{selected.label}</h3>
      <p className="text-sm text-slate-600">{selected.week ? "Weekly total" : "Total expenses"}: <strong className="tabular-nums">{formatRentalMoney(sumRentalWorkbookExpenses(selected.expenses))}</strong></p>
    </header>
    <GmeaRentalTransactionsTable rows={pageRows} expenseOnly onHistory={() => {}} onExpense={onExpense} onLocation={onLocation} />
    <div className={workspace.footer}>
      <p aria-live="polite">Page {index + 1} of {pages.length} · {selected.week ? "1 week per page" : "Expenses without a reporting week"}</p>
      <TablePagination page={index + 1} totalPages={pages.length} onChange={state.onPageChange} label="Expense week pages" appearance="compact" />
    </div>
  </article>;
}

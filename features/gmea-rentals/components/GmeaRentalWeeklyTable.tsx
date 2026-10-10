"use client";
import type { RentalExpense } from "../types";
import { formatRentalDate, formatRentalMoney } from "../utils/rentalUi";
import { rentalWeekMetadata, type RentalReportingWeek, type RentalWeekSection } from "../utils/rentalReportingWeeks";
import { rentalVatBreakdown } from "../utils/expenseCalculations";
import styles from "./rentalWeeklyReports.module.css";
import workspace from "@/components/workspace/workspace.module.css";

export default function GmeaRentalWeeklyTable({ week, canEdit, onDetails, onAdd }: {
  week: RentalReportingWeek; canEdit: boolean; onDetails: (expense: RentalExpense) => void; onAdd: (section: RentalWeekSection) => void;
}) {
  return <div className="space-y-5">{([
    ["equipment", "Equipment expenses", week.equipment], ["cash-advance", "Cash advances", week.cashAdvance], ["salary", "Salaries", week.salary],
  ] as const).map(([section, title, total]) => {
    const rows = week.expenses.filter(expense => rentalWeekMetadata(expense.notes)?.section === section);
    return <section key={section} aria-label={title}>
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{title}</h3>{canEdit && <button className={workspace.button} onClick={() => onAdd(section)}>Add {section === "equipment" ? "equipment expense" : section === "salary" ? "salary" : "cash advance"}</button>}</header>
      {rows.length ? <table className={styles.table}><thead><tr><th>Date</th><th>{section === "equipment" ? "Equipment" : "Payee"}</th>{section === "equipment" && <th>Description</th>}<th>Price</th><th>Actions</th></tr></thead><tbody>{rows.map(expense => <tr key={expense.id}>
        <td data-label="Date">{formatRentalDate(expense.date)}</td><td data-label={section === "equipment" ? "Equipment" : "Payee"}>{rentalWeekMetadata(expense.notes)?.party}</td>{section === "equipment" && <td data-label="Description">{expense.description}</td>}
        <td data-label="Price" className="font-semibold tabular-nums">{formatRentalMoney(rentalVatBreakdown(expense.amount, expense.vat_mode, expense.vat_rate).gross - expense.refunded_amount)}</td><td data-label="Actions"><button className={workspace.button} onClick={() => onDetails(expense)}>{canEdit ? "Edit" : "Details"}</button></td>
      </tr>)}</tbody><tfoot><tr><td colSpan={section === "equipment" ? 3 : 2}>{title} total</td><td className="tabular-nums">{formatRentalMoney(total)}</td><td /></tr></tfoot></table> : <p className="rounded bg-slate-50 px-4 py-3 text-sm text-slate-600">Not entered</p>}
    </section>;
  })}<div className="flex justify-between rounded bg-teal-700 p-4 font-semibold text-white"><span>Total weekly expenses</span><span>{formatRentalMoney(week.total)}</span></div></div>;
}

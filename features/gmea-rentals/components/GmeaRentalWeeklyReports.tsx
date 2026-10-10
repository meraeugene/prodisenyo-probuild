"use client";
import { useMemo, useState } from "react";
import type { RentalExpense, RentalOperationsData } from "../types";
import { buildRentalReportingWeeks, nextRentalReportingWeek, rentalReportingWeekId, sumRentalReportingMonth, type RentalWeekMetadata, type RentalWeekSection } from "../utils/rentalReportingWeeks";
import { formatRentalDate, formatRentalMoney } from "../utils/rentalUi";
import GmeaRentalWeeklyTable from "./GmeaRentalWeeklyTable";
import GmeaRentalExpenseForm from "./GmeaRentalExpenseForm";
import styles from "@/components/workspace/workspace.module.css";
import reportStyles from "./rentalWeeklyReports.module.css";

export default function GmeaRentalWeeklyReports({ operations, canEdit, view, onViewWeek, reportingMonth, onReportingMonthChange }: {
  operations: RentalOperationsData; canEdit: boolean; view: "monthly" | "weekly"; onViewWeek: () => void;
  reportingMonth?: string; onReportingMonthChange?: (month: string) => void;
}) {
  const weeks = useMemo(() => buildRentalReportingWeeks(operations.expenses), [operations.expenses]);
  const [localMonth, setLocalMonth] = useState(() => weeks.at(-1)?.month || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }).slice(0,7));
  const month = reportingMonth ?? localMonth;
  const setMonth = onReportingMonthChange ?? setLocalMonth;
  const [selected, setSelected] = useState("");
  const [editor, setEditor] = useState<{ expense?: RentalExpense; week: RentalWeekMetadata; newWeek?: boolean }>();
  const monthly = weeks.filter(week => week.month === month);
  const week = monthly.find(item => item.id === selected) || monthly[0];
  const monthTotal = sumRentalReportingMonth(weeks, month);
  function add(section: RentalWeekSection) {
    if (week) setEditor({ week: { month: week.month, start: week.start, end: week.end, section, party: section === "equipment" ? "Equipment" : "Drivers" } });
  }
  return <section aria-label="Weekly rental reporting" className="space-y-5 p-4 sm:p-5">
    <header className="flex flex-wrap justify-between gap-3"><div><h2 className="text-lg font-semibold">{view === "monthly" ? "Monthly rental expenses" : "Weekly rental expenses"}</h2><p className="mt-1 text-sm text-slate-500">{view === "monthly" ? "Monthly totals are the sum of each reporting week." : "Dated equipment expenses, cash advances, and salaries for this cutoff."}</p></div>{canEdit && <button className={styles.primaryButton} onClick={() => setEditor({ week: nextRentalReportingWeek(month, weeks), newWeek: true })}>New week</button>}</header>
    <div className="flex flex-wrap items-end gap-3"><label className={styles.field}>Month<input aria-label="Reporting month" type="month" value={month} className={styles.control} onChange={event => { setMonth(event.target.value); setSelected(""); }} /></label>
      {view === "weekly" && monthly.length > 0 && <label className={styles.field}>Week<select aria-label="Reporting week" value={week?.id || ""} className={styles.control} onChange={event => setSelected(event.target.value)}>{monthly.map(item => <option key={item.id} value={item.id}>{formatRentalDate(item.start)} – {formatRentalDate(item.end)}</option>)}</select></label>}
      <p className="pb-2 text-sm text-slate-500">{monthly.length} reporting {monthly.length === 1 ? "week" : "weeks"}</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2"><div className="rounded border border-slate-200 p-4"><p className="text-sm text-slate-500">Monthly total</p><p className="mt-2 text-2xl font-semibold tabular-nums">{formatRentalMoney(monthTotal)}</p></div><div className="rounded border border-slate-200 p-4"><p className="text-sm text-slate-500">{view === "weekly" ? "Selected week total" : "Expense entries"}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{view === "weekly" ? formatRentalMoney(week?.total || 0) : monthly.reduce((total,item) => total + item.expenses.length,0)}</p></div></div>
    {view === "monthly" ? <table className={reportStyles.table}><thead><tr><th>Week</th><th>Equipment</th><th>Cash advances</th><th>Salaries</th><th>Total</th><th>Actions</th></tr></thead><tbody>{monthly.map(item => <tr key={item.id}>
      <td data-label="Week">{formatRentalDate(item.start)} – {formatRentalDate(item.end)}</td><td data-label="Equipment">{formatRentalMoney(item.equipment)}</td><td data-label="Cash advances">{item.pending.includes("cash-advance") ? "Not entered" : formatRentalMoney(item.cashAdvance)}</td><td data-label="Salaries">{item.pending.includes("salary") ? "Not entered" : formatRentalMoney(item.salary)}</td><td data-label="Total" className="font-semibold tabular-nums">{formatRentalMoney(item.total)}</td><td data-label="Actions"><button className={styles.button} onClick={() => { setSelected(item.id); onViewWeek(); }}>View week</button></td>
    </tr>)}</tbody><tfoot><tr><td colSpan={4}>Monthly total</td><td>{formatRentalMoney(monthTotal)}</td><td /></tr></tfoot></table> : week && <GmeaRentalWeeklyTable week={week} canEdit={canEdit} onAdd={add} onDetails={expense => setEditor({ expense, week: { month: week.month, start: week.start, end: week.end, section: "equipment", party: "Equipment" } })} />}
    {!monthly.length && <p className="py-6 text-center text-sm text-slate-500">No reporting weeks for this month.{canEdit && " Create a new week to enter expenses."}</p>}
    {editor && <GmeaRentalExpenseForm equipment={operations.equipment} categories={operations.categories} expense={editor.expense} weekContext={editor.week} lockWeekDates={!editor.newWeek} readOnly={!canEdit} onClose={() => setEditor(undefined)} onSaved={savedWeek => { setMonth(savedWeek.month); setSelected(rentalReportingWeekId(savedWeek)); }} />}
  </section>;
}

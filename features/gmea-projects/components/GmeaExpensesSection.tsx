"use client";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Expense, GmeaExpenseOptions, GmeaProject } from "../types";
import {
  buttonClass,
  inputClass,
  EXPENSE_CATEGORIES,
} from "../utils/gmeaConstants";
import { formatMoney, sumMoney, vatBreakdown } from "../utils/gmeaCalculations";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaExpenseForm from "./GmeaExpenseForm";
import GmeaConfirmButton from "./GmeaConfirmButton";
import { markGmeaExpenseViewedAction } from "@/actions/gmeaProjects";
export default function GmeaExpensesSection({
  project,
  expenseOptions,
  canEdit,
}: {
  project: GmeaProject;
  expenseOptions: GmeaExpenseOptions;
  canEdit: boolean;
}) {
  const [editor, setEditor] = useState<{ expense?: Expense } | null>(null),
    [category, setCategory] = useState("");
  const save = useGmeaMutation(project);
  const { mutate } = useSWRConfig();
  function openExpense(expense: Expense) {
    setEditor({ expense });
    if (!canEdit && expense.is_new) {
      void markGmeaExpenseViewedAction(project.id, expense.id)
        .then(async () => {
          await mutate(["gmea-project", project.id]);
          await mutate("gmea-projects:list");
          window.dispatchEvent(new Event("gmea:expense-viewed"));
        })
        .catch(() => undefined);
    }
  }
  const visible = project.expenses.filter(
    (e) => !category || e.category === category,
  );
  const amounts = visible.map((e) =>
    vatBreakdown(e.amount, e.vat_mode, e.vat_rate),
  );
  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Expenses</h2>
        {canEdit && (
          <button className={buttonClass} onClick={() => setEditor({})}>
            New expense
          </button>
        )}
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          aria-label="Filter expense category"
          className={inputClass + " sm:max-w-64"}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <div className="text-sm">
          <span className="text-slate-500">Total expenses </span>
          <strong>{formatMoney(sumMoney(amounts.map((a) => a.gross)))}</strong>
          <span className="ml-4 text-slate-500">Input VAT </span>
          <strong>{formatMoney(sumMoney(amounts.map((a) => a.vat)))}</strong>
          <span className="ml-4 text-slate-500">Refunded Sir Edward </span>
          <strong>
            {formatMoney(
              sumMoney(visible.map((expense) => expense.refunded_amount ?? 0)),
            )}
          </strong>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              {[
                "Date",
                "Description / category",
                "Supplier / invoice",
                "Payment method",
                "Base",
                "Input VAT",
                "Total",
                "Refunded Sir Edward",
                "Actions",
              ].map((h) => (
                <th className="p-3" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((e) => {
              const a = vatBreakdown(e.amount, e.vat_mode, e.vat_rate);
              return (
                <tr key={e.id}>
                  <td className="whitespace-nowrap p-3">{e.date}</td>
                  <td className="max-w-64 p-3">
                    <p className="font-medium">{e.description}</p>
                    {e.is_new && (
                      <span className="mt-1 inline-flex rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-800">
                        New
                      </span>
                    )}
                    <p className="mt-1 text-xs text-slate-500">{e.category}</p>
                  </td>
                  <td className="p-3">
                    {e.supplier || "—"}
                    <p className="mt-1 text-xs text-slate-500">
                      {e.invoice_number}
                    </p>
                  </td>
                  <td className="p-3">{e.method}</td>
                  <td className="p-3">{formatMoney(a.base)}</td>
                  <td className="p-3">{formatMoney(a.vat)}</td>
                  <td className="p-3 font-semibold">{formatMoney(a.gross)}</td>
                  <td className="p-3">
                    {formatMoney(e.refunded_amount ?? 0)}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label={canEdit ? "Edit expense" : "Details"}
                        title={canEdit ? "Edit expense" : "View expense details"}
                        className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => openExpense(e)}
                      >
                        {canEdit ? <Pencil size={17} /> : <Eye size={17} />}
                      </button>
                      {canEdit && (
                        <GmeaConfirmButton
                          label="Delete expense"
                          danger
                          triggerIcon={<Trash2 size={17} />}
                          description="Remove this expense and recalculate the project totals?"
                          onConfirm={() =>
                            save({
                              kind: "delete",
                              entity: "expense",
                              id: e.id,
                            })
                          }
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!visible.length && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  No expenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editor && (
        <GmeaExpenseForm
          project={project}
          expenseOptions={expenseOptions}
          expense={editor.expense}
          readOnly={!canEdit}
          onClose={() => setEditor(null)}
        />
      )}
    </section>
  );
}

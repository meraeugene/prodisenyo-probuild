"use client";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { GmeaRental, RentalOperationsData, RentalExpense } from "../types";
import { rentalVatBreakdown } from "../utils/expenseCalculations";
import {
  formatRentalMoney,
  rentalInputClass,
  rentalPrimaryButtonClass,
} from "../utils/rentalUi";
import { useGmeaRentalOperationsMutation } from "../hooks/useGmeaRentalOperationsMutation";
import GmeaRentalExpenseForm from "./GmeaRentalExpenseForm";

export default function GmeaRentalExpensesSection({
  rental,
  operations,
  canEdit,
}: {
  rental: GmeaRental;
  operations: RentalOperationsData;
  canEdit: boolean;
}) {
  const [editor, setEditor] = useState<RentalExpense | null | undefined>();
  const [category, setCategory] = useState("");
  const { saveExpense, pending, error } =
    useGmeaRentalOperationsMutation(rental);
  const rentalEquipmentIds = new Set(
    rental.items.map((item) => item.equipment_id),
  );
  const relevant = operations.expenses.filter(
    (expense) =>
      expense.rental_id === rental.id ||
      (!expense.rental_id &&
        !!expense.equipment_id &&
        rentalEquipmentIds.has(expense.equipment_id)) ||
      (!expense.rental_id && !expense.equipment_id),
  );
  const visible = relevant.filter(
    (expense) => !category || expense.category_id === category,
  );
  const totals = useMemo(
    () =>
      visible.reduce(
        (result, expense) => {
          const value = rentalVatBreakdown(
            expense.amount,
            expense.vat_mode,
            expense.vat_rate,
          );
          result.gross += value.gross;
          result.vat += value.vat;
          result.refunded += expense.refunded_amount;
          return result;
        },
        { gross: 0, vat: 0, refunded: 0 },
      ),
    [visible],
  );
  const categoryById = new Map(
    operations.categories.map((item) => [item.id, item.name]),
  );
  const equipmentById = new Map(
    operations.equipment.map((item) => [item.id, item.name]),
  );

  function remove(expense: RentalExpense) {
    if (!window.confirm("Delete this rental expense?")) return;
    void saveExpense(expense, { kind: "delete" }).catch(() => undefined);
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Rental expenses
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Rental, equipment, and general operational spending.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditor(null)}
            className={rentalPrimaryButtonClass}
          >
            <Plus size={16} /> New expense
          </button>
        )}
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={rentalInputClass + " sm:w-64"}
          >
            <option value="">All categories</option>
            {operations.categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["Total expenses", totals.gross],
            ["Input VAT", totals.vat],
            ["Refunded amount", totals.refunded],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="min-w-44 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3"
            >
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="mt-1 font-semibold text-slate-950 tabular-nums">
                {formatRentalMoney(Number(value))}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>
              {[
                "Date",
                "Description / category",
                "Scope",
                "Supplier / invoice",
                "Method",
                "Base",
                "VAT",
                "Total",
                "Refunded",
                "Actions",
              ].map((heading) => (
                <th key={heading} className="p-3">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((expense) => {
              const amount = rentalVatBreakdown(
                expense.amount,
                expense.vat_mode,
                expense.vat_rate,
              );
              const scope = expense.rental_id
                ? expense.equipment_id
                  ? "Rental + equipment"
                  : "Rental"
                : expense.equipment_id
                  ? "Equipment only"
                  : "General";
              return (
                <tr key={expense.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap p-3">{expense.date}</td>
                  <td className="max-w-64 p-3">
                    <p className="font-medium text-slate-900">
                      {expense.description}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {categoryById.get(expense.category_id) ?? "Category"}
                    </p>
                    {expense.notes && (
                      <p className="mt-1 text-xs text-slate-500">
                        {expense.notes}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <p>{scope}</p>
                    {expense.equipment_id && (
                      <p className="mt-1 text-xs text-slate-500">
                        {equipmentById.get(expense.equipment_id)}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    {expense.supplier || "—"}
                    <p className="mt-1 text-xs text-slate-500">
                      {expense.invoice_number}
                    </p>
                  </td>
                  <td className="p-3">{expense.method || "—"}</td>
                  <td className="p-3 tabular-nums">
                    {formatRentalMoney(amount.base)}
                  </td>
                  <td className="p-3 tabular-nums">
                    {formatRentalMoney(amount.vat)}
                  </td>
                  <td className="p-3 font-semibold tabular-nums">
                    {formatRentalMoney(amount.gross)}
                  </td>
                  <td className="p-3 tabular-nums">
                    {formatRentalMoney(expense.refunded_amount)}
                  </td>
                  <td className="p-3">
                    {canEdit && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditor(expense)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => remove(expense)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {!visible.length && (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  No rental expenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editor !== undefined && (
        <GmeaRentalExpenseForm
          rental={rental}
          equipment={operations.equipment}
          categories={operations.categories}
          expense={editor ?? undefined}
          onClose={() => setEditor(undefined)}
        />
      )}
    </section>
  );
}

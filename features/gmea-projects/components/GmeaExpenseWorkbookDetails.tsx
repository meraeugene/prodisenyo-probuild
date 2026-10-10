import type { Expense } from "../types";
import { formatMoney } from "../utils/gmeaCalculations";

export default function GmeaExpenseWorkbookDetails({ expense }: { expense: Expense }) {
  if (!expense.workbook_source) return null;
  const source = expense.workbook_source;
  return (
    <section className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm">
      <p className="font-medium text-slate-700">Source: {source.workbook} · {source.sheet}!{source.cells}</p>
      {!!expense.workbook_items?.length && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <caption className="p-3 text-left text-slate-500">These items are included in the recorded expense total.</caption>
            <thead className="bg-slate-50"><tr><th className="p-3">Description</th><th className="p-3">Date</th><th className="p-3">Invoice</th><th className="p-3 text-right">Amount</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {expense.workbook_items.map((item) => (
                <tr key={item.source_cells}><td className="p-3">{item.description}</td><td className="p-3">{item.date || "Not provided"}</td><td className="p-3">{item.invoice_number || "—"}</td><td className="p-3 text-right tabular-nums">{formatMoney(item.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

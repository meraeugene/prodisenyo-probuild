import { BarChart3 } from "lucide-react";
import {
  equipmentProfitability,
  reportSummary,
} from "../utils/rentalAnalytics";
import { formatRentalMoney } from "../utils/rentalUi";

const entries = [
  ["Rental revenue", "revenue"],
  ["Fuel expenses", "fuel"],
  ["Maintenance", "maintenance"],
  ["Repair / parts", "repairParts"],
  ["Driver / operator / labor", "labor"],
  ["Cash advances", "cashAdvance"],
  ["Miscellaneous", "miscellaneous"],
] as const;

export function GmeaRentalExpenseBreakdown({
  summary,
}: {
  summary: ReturnType<typeof reportSummary>;
}) {
  return (
    <article className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]">
      <div className="flex items-center gap-2">
        <BarChart3 size={15} className="text-[#087d76]" />
        <h2 className="text-[16px] font-bold tracking-[-0.025em] text-slate-950">
          Expense breakdown
        </h2>
      </div>
      <dl className="mt-4 divide-y divide-slate-100">
        {entries.map(([label, key]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 py-3 text-sm"
          >
            <dt className="text-slate-600">{label}</dt>
            <dd className="font-semibold text-slate-900 tabular-nums">
              {formatRentalMoney(
                key === "revenue" ? summary.revenue : summary.expenses[key],
              )}
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 py-3 text-sm">
          <dt className="font-semibold text-slate-900">Total expenses</dt>
          <dd className="font-bold text-slate-950 tabular-nums">
            {formatRentalMoney(summary.totalExpenses)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 text-sm">
          <dt className="font-semibold text-slate-900">Net profit / loss</dt>
          <dd
            className={
              "font-bold tabular-nums " +
              (summary.net < 0 ? "text-rose-700" : "text-[#087d76]")
            }
          >
            {formatRentalMoney(summary.net)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function GmeaRentalCalculationNote() {
  return (
    <article className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]">
      <h2 className="text-[16px] font-bold tracking-[-0.025em] text-slate-950">
        How this report is calculated
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Only posted rental payments count as revenue. Voided payments are
        excluded. Expense totals include the configured VAT treatment and
        subtract refunded amounts.
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Equipment profitability uses each equipment item&apos;s billed subtotal,
        less expenses directly linked to that equipment. It is portfolio-to-date
        because rental billing items are not dated transactions.
      </p>
    </article>
  );
}

export function GmeaRentalEquipmentProfitability({
  items,
}: {
  items: ReturnType<typeof equipmentProfitability>;
}) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]">
      <div className="p-5">
        <h2 className="text-[16px] font-bold tracking-[-0.025em] text-slate-950">
          Equipment profitability
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Billed equipment revenue less equipment-related expenses.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[680px] w-full text-left text-sm">
          <thead className="border-y border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-5 py-3">Equipment</th>
              <th className="px-5 py-3 text-right">Billed revenue</th>
              <th className="px-5 py-3 text-right">Expenses</th>
              <th className="px-5 py-3 text-right">Profit / loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length ? (
              items.map((item) => (
                <tr key={item.equipment.id}>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-900">
                      {item.equipment.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.equipment.code}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">
                    {formatRentalMoney(item.revenue)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">
                    {formatRentalMoney(item.expenses)}
                  </td>
                  <td
                    className={
                      "px-5 py-3 text-right font-bold tabular-nums " +
                      (item.profit < 0 ? "text-rose-700" : "text-[#087d76]")
                    }
                  >
                    {formatRentalMoney(item.profit)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  No equipment profitability data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

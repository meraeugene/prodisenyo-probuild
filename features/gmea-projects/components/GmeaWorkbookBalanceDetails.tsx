"use client";

import type { Expense } from "../types";
import { formatMoney } from "../utils/gmeaCalculations";
import GmeaDialog from "./GmeaDialog";

export default function GmeaWorkbookBalanceDetails({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  const balance = expense.workbook_balance!;
  return (
    <GmeaDialog title="Workbook expense balance" onClose={onClose} compact>
      <dl className="space-y-4 text-sm">
        <div><dt className="text-slate-500">Expense total in workbook</dt><dd className="font-semibold">{formatMoney(balance.source_total)}</dd></div>
        <div><dt className="text-slate-500">Itemized expenses at import</dt><dd className="font-semibold">{formatMoney(balance.itemized_total)}</dd></div>
        <div><dt className="text-slate-500">Remaining workbook balance</dt><dd className="font-semibold">{formatMoney(balance.amount)}</dd></div>
        {!!balance.settlements?.length && (
          <div><dt className="text-slate-500">Replaced by itemized expenses</dt><dd className="font-semibold">{formatMoney(balance.settlements.reduce((sum, entry) => sum + entry.amount, 0))}</dd></div>
        )}
        <div><dt className="text-slate-500">Source</dt><dd>{balance.source.workbook} · {balance.source.sheet}!{balance.source.cells}</dd></div>
      </dl>
      <p className="mt-5 text-sm leading-6 text-slate-500">This balance brings the existing expense records to the workbook total. It is not an additional invoice. The workbook does not provide a transaction date for this summary balance.</p>
    </GmeaDialog>
  );
}

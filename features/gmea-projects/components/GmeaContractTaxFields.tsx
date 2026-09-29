"use client";

import { formatMoney, projectContractBreakdown } from "../utils/gmeaCalculations";
import { MoneyField } from "./GmeaFields";

export default function GmeaContractTaxFields({
  enabled,
  baseAmount,
  taxRate,
  onEnabledChange,
  onTaxRateChange,
}: {
  enabled: boolean;
  baseAmount: number;
  taxRate: number;
  onEnabledChange: (enabled: boolean) => void;
  onTaxRateChange: (taxRate: number) => void;
}) {
  const breakdown = projectContractBreakdown({
    contract_amount: baseAmount,
    tax_rate: enabled ? taxRate : 0,
  });

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
        />
        <span>
          <span className="block text-sm font-semibold text-slate-800">Apply project tax</span>
          <span className="block text-xs leading-5 text-slate-500">
            Tax is added to the contract total, then deducted with project expenses when calculating profit.
          </span>
        </span>
      </label>

      {enabled && (
        <div className="max-w-xs">
          <MoneyField
            label="Tax percentage (%) *"
            required
            value={taxRate}
            onValueChange={onTaxRateChange}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Pre-tax amount", breakdown.baseContract],
          [`Tax (${breakdown.taxRate}%)`, breakdown.taxAmount],
          ["Total with tax", breakdown.totalContract],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(Number(value))}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

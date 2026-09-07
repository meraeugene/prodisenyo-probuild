"use client";
import type { QuotationItem } from "../types";
import { inputClass, secondaryClass } from "../utils/gmeaConstants";
import { formatMoney, money } from "../utils/gmeaCalculations";

export default function GmeaQuotationItems({
  items,
  onChange,
  readOnly,
}: {
  items: QuotationItem[];
  onChange: (items: QuotationItem[]) => void;
  readOnly: boolean;
}) {
  function update(
    index: number,
    field: keyof QuotationItem,
    value: string | number,
  ) {
    onChange(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  }
  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-slate-900">Quotation items</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[650px] text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              {[
                "Description",
                "Unit",
                "Quantity",
                "Unit price",
                "Amount",
                "",
              ].map((label, i) => (
                <th className="px-3 py-3" key={i}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, i) => (
              <tr key={i}>
                <td className="min-w-48 p-2">
                  <input
                    aria-label={"Item " + (i + 1) + " description"}
                    className={inputClass}
                    required
                    maxLength={1000}
                    value={item.description}
                    onChange={(e) => update(i, "description", e.target.value)}
                  />
                </td>
                <td className="w-24 p-2">
                  <input
                    aria-label={"Item " + (i + 1) + " unit"}
                    className={inputClass}
                    required
                    maxLength={30}
                    value={item.unit}
                    onChange={(e) => update(i, "unit", e.target.value)}
                  />
                </td>
                <td className="w-28 p-2">
                  <input
                    aria-label={"Item " + (i + 1) + " quantity"}
                    className={inputClass}
                    required
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={item.quantity || ""}
                    onChange={(e) =>
                      update(i, "quantity", Number(e.target.value))
                    }
                  />
                </td>
                <td className="w-32 p-2">
                  <input
                    aria-label={"Item " + (i + 1) + " unit price"}
                    className={inputClass}
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) =>
                      update(i, "unit_price", Number(e.target.value))
                    }
                  />
                </td>
                <td className="whitespace-nowrap p-3 font-medium">
                  {Number.isFinite(item.quantity * item.unit_price) &&
                  Math.abs(item.quantity * item.unit_price) <= 1e12
                    ? formatMoney(money(item.quantity * item.unit_price))
                    : "—"}
                </td>
                <td className="p-2">
                  {!readOnly && (
                    <button
                      type="button"
                      aria-label={"Remove item " + (i + 1)}
                      className="p-2 text-rose-700"
                      onClick={() =>
                        onChange(items.filter((_, index) => index !== i))
                      }
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <button
          type="button"
          className={secondaryClass}
          onClick={() =>
            onChange([
              ...items,
              { description: "", unit: "pcs", quantity: 1, unit_price: 0 },
            ])
          }
        >
          + Add item
        </button>
      )}
    </section>
  );
}

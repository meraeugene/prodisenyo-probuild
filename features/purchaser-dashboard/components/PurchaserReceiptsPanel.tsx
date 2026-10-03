import type { PurchaserDashboardRecord } from "@/features/purchaser-dashboard/types";
import {
  formatPurchaserDate,
  purchaseOrderCode,
} from "@/features/purchaser-dashboard/utils/purchaserDashboard";

export default function PurchaserReceiptsPanel({ records }: { records: PurchaserDashboardRecord[] }) {
  const receipts = records.filter((record) => record.receiptInvoiceReference);
  return (
    <section className="rounded-2xl border border-transparent bg-white p-5 shadow-workspace">
      <div>
        <h2 className="font-bold text-slate-950">Receipt & Invoice References</h2>
        <p className="mt-0.5 text-xs text-slate-500">References recorded on purchase orders</p>
      </div>
      <div className="mt-4 divide-y divide-slate-100">
        {receipts.slice(0, 5).map((record) => (
          <div key={record.id} className="flex items-center gap-3 py-3 first:pt-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">{record.receiptInvoiceReference}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{purchaseOrderCode(record.id)} · {record.itemName}</p>
            </div>
            <p className="shrink-0 text-[10px] text-slate-400">{formatPurchaserDate(record.updatedAt)}</p>
          </div>
        ))}
        {!receipts.length ? <p className="py-8 text-center text-sm text-slate-500">No receipt or invoice references have been recorded.</p> : null}
      </div>
    </section>
  );
}

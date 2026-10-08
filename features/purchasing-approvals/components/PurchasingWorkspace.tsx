"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import DashboardPageHero from "@/components/DashboardPageHero";
import PurchasingRecordsSkeleton from "@/features/purchasing-approvals/components/PurchasingRecordsSkeleton";
import {
  getPurchasingRecordsAction,
  getPurchaseReceiptDownloadUrlAction,
  updatePurchaseOrderAction,
  type DeliveryStatus,
  type PurchasingRecord,
  type PurchaseStatus,
} from "@/actions/purchasing";
import { cn } from "@/lib/utils";
import WorkspaceListToolbar from "@/components/workspace/WorkspaceListToolbar";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import styles from "@/components/workspace/workspace.module.css";
import PurchasingRecordsTable from "./PurchasingRecordsTable";
import { usePurchasingList } from "../hooks/usePurchasingList";
import { formatPurchaseMoney as money, purchaseStatusLabel } from "../utils/purchasingPresentation";

const STATUS_OPTIONS: PurchaseStatus[] = [
  "draft", "submitted", "approved", "ordered", "received", "cancelled",
];
const DELIVERY_OPTIONS: DeliveryStatus[] = [
  "pending", "scheduled", "in_transit", "delivered",
];

export default function PurchasingWorkspace() {
  const [records, setRecords] = useState<PurchasingRecord[]>([]);
  const list = usePurchasingList(records);
  const [editing, setEditing] = useState<PurchasingRecord | null>(null);
  const [selectedReceiptName, setSelectedReceiptName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getPurchasingRecordsAction()
      .then(setRecords)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load purchases."))
      .finally(() => setLoading(false));
  }, []);

  const total = records.reduce(
    (sum, record) => sum + record.quantity * (record.actualUnitCost || record.estimatedUnitCost),
    0,
  );

  function save(formData: FormData) {
    if (!editing) return;
    startTransition(async () => {
      try {
        const updated = await updatePurchaseOrderAction(formData);
        setRecords((current) => current.map((record) => record.id === updated.id ? updated : record));
        setEditing(null);
        setSelectedReceiptName("");
        toast.success("Purchase details updated.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update purchase.");
      }
    });
  }

  function openReceipt(evidenceId: string) {
    startTransition(async () => {
      try {
        const url = await getPurchaseReceiptDownloadUrlAction(evidenceId);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to open receipt.");
      }
    });
  }

  return (
    <div className="min-h-full space-y-4 bg-white p-4 sm:p-6">
      <DashboardPageHero eyebrow="Procurement" title="Purchasing" description="Manage supplier pricing, purchase orders, delivery progress, and receipt records." actions={<span className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#076d69] shadow-sm sm:w-auto">
           Purchase value: {money(total)}
        </span>} />

      <section aria-label="Purchasing records" className={styles.panel}>
        <WorkspaceListToolbar tabs={list.tabs} tab={list.status} onTabChange={list.setStatus}
          query={list.query} onQueryChange={list.setQuery} searchLabel="Search purchases" placeholder="Search project, material, supplier or reference"
          hasFilters={list.hasFilters} onReset={list.reset}>
          <label className={styles.field}>Delivery<select className={styles.control} value={list.delivery} onChange={(event) => list.setDelivery(event.target.value)}>
            <option value="all">All deliveries</option>{DELIVERY_OPTIONS.map((value) => <option key={value} value={value}>{purchaseStatusLabel(value)}</option>)}
          </select></label>
        </WorkspaceListToolbar>
        {loading ? <PurchasingRecordsSkeleton /> : <>
          <PurchasingRecordsTable records={list.pagination.pageRows} onReceipt={openReceipt} onEdit={(record) => { setEditing(record); setSelectedReceiptName(""); }} />
          {!list.filtered.length && <p className={styles.empty}>{records.length ? "No purchases match these filters." : "No approved material purchases are assigned yet."}</p>}
          <WorkspaceListPagination {...list.pagination} total={list.filtered.length} noun="purchases" label="Purchasing table" />
        </>}
      </section>
      {editing ? createPortal(
        <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
          <form action={save} className={`${styles.dialog} h-[80dvh] max-h-[80dvh] w-full max-w-2xl space-y-4 overflow-y-auto border border-white/80 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.35)] sm:p-7`}>
            <input type="hidden" name="id" value={editing.id} />
            <div><h2 className="text-lg font-bold text-apple-charcoal">Update purchase</h2><p className="text-xs text-apple-smoke">{editing.itemName}</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">Supplier<input name="supplierName" defaultValue={editing.supplierName} className="mt-1 h-10 w-full rounded-xl border border-apple-mist px-3 text-sm" /></label>
              <label className="text-xs font-semibold text-slate-700">Actual unit cost<input name="actualUnitCost" type="number" min="0" step="0.01" defaultValue={editing.actualUnitCost} className="mt-1 h-10 w-full rounded-xl border border-apple-mist px-3 text-sm" /></label>
              <label className="text-xs font-semibold text-slate-700">Purchase status<select name="status" defaultValue={editing.status} className="mt-1 h-10 w-full rounded-xl border border-apple-mist px-3 text-sm">{STATUS_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-xs font-semibold text-slate-700">Delivery status<select name="deliveryStatus" defaultValue={editing.deliveryStatus} className="mt-1 h-10 w-full rounded-xl border border-apple-mist px-3 text-sm">{DELIVERY_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select></label>
            </div>
            <label className="block text-xs font-semibold text-slate-700">Supplier quotation reference<input name="quotationReference" defaultValue={editing.quotationReference} placeholder="Quotation number or file reference" className="mt-1 h-10 w-full rounded-xl border border-apple-mist px-3 text-sm" /></label>
            <label className="block text-xs font-semibold text-slate-700">Receipt / invoice reference<input name="receiptInvoiceReference" defaultValue={editing.receiptInvoiceReference} placeholder="Invoice number (optional when uploading a file)" className="mt-1 h-10 w-full rounded-xl border border-apple-mist px-3 text-sm" /></label>
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/40 p-4 text-center transition hover:border-teal-400 hover:bg-teal-50">
              <input name="receiptFile" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" className="sr-only" onChange={(event) => setSelectedReceiptName(event.target.files?.[0]?.name ?? "")} />
              <UploadCloud size={22} className="mx-auto text-teal-700" />
              <span className="mt-2 block text-sm font-semibold text-slate-800">Upload receipt or invoice</span>
              <span className="mt-1 block text-xs text-slate-500">PDF, PNG or JPG, up to 10 MB</span>
              {selectedReceiptName ? <span className="mt-2 block text-xs font-semibold text-teal-700">Selected: {selectedReceiptName}</span> : editing.receiptFile ? <span className="mt-2 block text-xs font-semibold text-teal-700">Current: {editing.receiptFile.fileName}</span> : null}
            </label>
            <label className="block text-xs font-semibold text-slate-700">Notes<textarea name="notes" defaultValue={editing.notes} rows={3} className="mt-1 w-full rounded-xl border border-apple-mist p-3 text-sm" /></label>
            <div className="flex justify-end gap-2 border-t border-apple-mist pt-4">
              <button type="button" onClick={() => { setEditing(null); setSelectedReceiptName(""); }} className="h-10 rounded-xl border border-apple-mist px-4 text-sm">Cancel</button>
              <button disabled={isPending} className={cn("flex h-10 items-center gap-2 rounded-xl bg-[#076d69] px-5 text-sm font-semibold text-white", isPending && "opacity-60")}>{isPending ? <LoaderCircle size={14} className="animate-spin" /> : null}Save</button>
            </div>
          </form>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

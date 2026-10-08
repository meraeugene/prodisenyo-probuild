import { useState } from "react";
import type { PurchasingRecord, PurchaseStatus } from "@/actions/purchasing";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import { purchaseStatusLabel } from "../utils/purchasingPresentation";

export function usePurchasingList(records: PurchasingRecord[]) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PurchaseStatus | "all">("all");
  const [delivery, setDelivery] = useState("all");
  const filtered = records.filter((record) => (status === "all" || record.status === status)
    && (delivery === "all" || record.deliveryStatus === delivery)
    && [record.projectName, record.itemName, record.supplierName, record.quotationReference, record.receiptInvoiceReference]
      .join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  const pagination = useTablePagination(filtered, JSON.stringify([query, status, delivery]));
  const tabs = [{ value: "all" as const, label: "All purchases", count: records.length },
    ...(["draft", "submitted", "approved", "ordered", "received", "cancelled"] as const).map((value) => ({
      value, label: purchaseStatusLabel(value), count: records.filter((record) => record.status === value).length,
    }))];
  return { query, setQuery, status, setStatus, delivery, setDelivery, filtered, pagination, tabs,
    reset: () => { setQuery(""); setStatus("all"); setDelivery("all"); },
    hasFilters: Boolean(query || status !== "all" || delivery !== "all"),
  };
}

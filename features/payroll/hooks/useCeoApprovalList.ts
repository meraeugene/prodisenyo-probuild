import { useMemo, useState } from "react";
import { useCeoTablePagination } from "@/features/ceo-workspace/hooks/useCeoTablePagination";
import { selectCeoApprovalRows, type CeoApprovalRow, type CeoApprovalStatus } from "../utils/ceoApprovalFilters";

export function useCeoApprovalList<T extends CeoApprovalRow>(rows: T[]) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CeoApprovalStatus>("all");
  const visible = useMemo(() => selectCeoApprovalRows(rows, query, status), [rows, query, status]);
  const pagination = useCeoTablePagination(visible, JSON.stringify([query, status]));
  const tabs = ([{ value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Returned" }] as const)
    .map((tab) => ({ ...tab, count: tab.value === "all" ? rows.length : rows.filter((row) => row.status === tab.value).length }));
  return { query, setQuery, status, setStatus, tabs, visible, pagination, hasFilters: query !== "" || status !== "all", reset: () => { setQuery(""); setStatus("all"); } };
}

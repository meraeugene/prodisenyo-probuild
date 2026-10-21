"use client";
import { useMemo, useState } from "react";
import type { RentalIncomeRecord } from "../incomeTypes";
import type { RentalExpense } from "../types";
import type { RentalTransactionType } from "../transactionTypes";
import type { RentalIncomeTab } from "../utils/rentalWorkbookRecords";
import { buildRentalTransactions, rentalTransactionMonths, rentalTransactionOptions, selectRentalTransactions } from "../utils/rentalTransactions";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import { useRentalExpensePages } from "./useRentalExpensePages";

export function useRentalTransactions(records: RentalIncomeRecord[], expenses: RentalExpense[]) {
  const [type, setType] = useState<RentalTransactionType>("all"), [paymentType, setPaymentType] = useState<RentalIncomeTab>("all");
  const [query, setQuery] = useState(""), [client, setClient] = useState(""), [location, setLocation] = useState("");
  const [month, setMonth] = useState("");
  const rows = useMemo(() => buildRentalTransactions(records, expenses), [records, expenses]);
  const monthOptions = useMemo(() => rentalTransactionMonths(rows.filter(row => type === "all" || row.type === type)), [rows, type]);
  const visible = useMemo(() => selectRentalTransactions(rows, type, paymentType, query, client, location, month), [rows, type, paymentType, query, client, location, month]);
  const filterKey = JSON.stringify([type, paymentType, query, client, location, month]);
  const pagination = useTablePagination(visible, filterKey);
  const expensePages = useRentalExpensePages(visible, filterKey);
  function changeType(value: RentalTransactionType) {
    setType(value); setPaymentType("all");
    if (month && !rentalTransactionMonths(rows.filter(row => value === "all" || row.type === value)).some(option => option.value === month)) setMonth("");
  }
  function reset() { setType("all"); setPaymentType("all"); setQuery(""); setClient(""); setLocation(""); setMonth(""); }
  return { type, changeType, paymentType, setPaymentType, query, setQuery, client, setClient, location, setLocation, month, setMonth, monthOptions, rows, visible, pagination, expensePages, reset,
    hasFilters: Boolean(type !== "all" || paymentType !== "all" || query || client || location || month),
    clientOptions: rentalTransactionOptions(records, "client"), locationOptions: rentalTransactionOptions(records, "location") };
}

"use client";
import { useMemo, useState } from "react";
import type { RentalIncomeRecord } from "../incomeTypes";
import type { RentalExpense } from "../types";
import type { RentalTransactionType } from "../transactionTypes";
import type { RentalIncomeTab } from "../utils/rentalWorkbookRecords";
import { buildRentalTransactions, rentalTransactionOptions, selectRentalTransactions } from "../utils/rentalTransactions";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";

const emptyExpenses: RentalExpense[] = [];

export function useRentalTransactions(records: RentalIncomeRecord[], expenses: RentalExpense[] = emptyExpenses) {
  const [type, setType] = useState<RentalTransactionType>("all"), [paymentType, setPaymentType] = useState<RentalIncomeTab>("all");
  const [query, setQuery] = useState(""), [client, setClient] = useState(""), [location, setLocation] = useState("");
  const rows = useMemo(() => buildRentalTransactions(records, expenses), [records, expenses]);
  const visible = useMemo(() => selectRentalTransactions(rows, type, paymentType, query, client, location), [rows, type, paymentType, query, client, location]);
  const pagination = useTablePagination(visible, JSON.stringify([type, paymentType, query, client, location]));
  function changeType(value: RentalTransactionType) { setType(value); setPaymentType("all"); }
  function reset() { setType("all"); setPaymentType("all"); setQuery(""); setClient(""); setLocation(""); }
  return { type, changeType, paymentType, setPaymentType, query, setQuery, client, setClient, location, setLocation, rows, visible, pagination, reset,
    hasFilters: Boolean(type !== "all" || paymentType !== "all" || query || client || location),
    clientOptions: rentalTransactionOptions(records, "client"), locationOptions: rentalTransactionOptions(records, "location") };
}

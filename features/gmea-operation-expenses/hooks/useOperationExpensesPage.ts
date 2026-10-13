"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { getGmeaOperationExpensesAction } from "@/actions/gmeaOperationExpenses";
import type { OperationExpense } from "../types";
import { selectOperationExpenses, summarizeOperationExpenses } from "../utils/operationExpenseSelectors";
import { rentalExpensePeriodRange } from "@/features/gmea-rentals/utils/rentalExpensePeriods";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import { buildOperationExpenseTrend } from "../utils/operationExpenseCharts";

export function useOperationExpensesPage(initialExpenses: OperationExpense[], canEdit: boolean) {
  const { data: expenses = initialExpenses, error } = useSWR("gmea-operation-expenses:list", getGmeaOperationExpensesAction,
    { fallbackData: initialExpenses, refreshInterval: canEdit ? 0 : 30000 });
  const [period, setPeriod] = useState<"month" | "week">("month");
  const [view, setView] = useState<"records" | "analytics">("records");
  const [anchor, setAnchor] = useState(() => initialExpenses.map(row => row.date).sort().at(-1)
    || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }));
  const [query, setQuery] = useState(""), [category, setCategory] = useState("");
  const [editor, setEditor] = useState<OperationExpense | null | undefined>();
  const visible = useMemo(() => selectOperationExpenses(expenses, period, anchor, query, category), [expenses, period, anchor, query, category]);
  const summary = useMemo(() => summarizeOperationExpenses(visible), [visible]);
  const trend = useMemo(() => buildOperationExpenseTrend(visible, period, anchor), [visible, period, anchor]);
  const range = rentalExpensePeriodRange(period, anchor);
  const pagination = useTablePagination(visible, JSON.stringify([period, anchor, query, category]));
  const defaultAnchor = expenses.map(row => row.date).sort().at(-1) || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const hasFilters = Boolean(query || category || period !== "month" || anchor.slice(0, 7) !== defaultAnchor.slice(0, 7));
  function resetFilters() { setPeriod("month"); setAnchor(defaultAnchor); setQuery(""); setCategory(""); }
  return { view, setView, period, setPeriod, anchor, setAnchor, query, setQuery, category, setCategory, editor, setEditor, visible, summary, trend, range, pagination, error, hasFilters, resetFilters };
}

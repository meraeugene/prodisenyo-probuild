"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { getGmeaOperationExpensesAction } from "@/actions/gmeaOperationExpenses";
import type { OperationExpense } from "../types";
import { selectOperationExpenses, summarizeOperationExpenses } from "../utils/operationExpenseSelectors";
import { rentalExpensePeriodRange } from "@/features/gmea-rentals/utils/rentalExpensePeriods";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import { buildOperationExpenseTrend } from "../utils/operationExpenseCharts";

export function useOperationExpensesPage(initialExpenses: OperationExpense[]) {
  const { data: expenses = initialExpenses, error, mutate } = useSWR("gmea-operation-expenses:list", getGmeaOperationExpensesAction,
    { fallbackData: initialExpenses, refreshInterval: 30000 });
  const [period, setPeriod] = useState<"month" | "week">("month");
  const [view, setView] = useState<"records" | "analytics">("records");
  const defaultAnchor = expenses.map(row => row.date).sort().at(-1) || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const [chosenAnchor, setAnchor] = useState<string | null>(null);
  const anchor = chosenAnchor ?? defaultAnchor;
  const [query, setQuery] = useState(""), [category, setCategory] = useState("");
  const [editor, setEditor] = useState<OperationExpense | null | undefined>();
  const visible = useMemo(() => selectOperationExpenses(expenses, period, anchor, query, category), [expenses, period, anchor, query, category]);
  const summary = useMemo(() => summarizeOperationExpenses(visible), [visible]);
  const trend = useMemo(() => buildOperationExpenseTrend(visible, period, anchor), [visible, period, anchor]);
  const range = rentalExpensePeriodRange(period, anchor);
  const pagination = useTablePagination(visible, JSON.stringify([period, anchor, query, category]));
  const hasFilters = Boolean(query || category || period !== "month" || anchor.slice(0, 7) !== defaultAnchor.slice(0, 7));
  function resetFilters() { setPeriod("month"); setAnchor(defaultAnchor); setQuery(""); setCategory(""); }
  async function revealSavedExpense(expense: OperationExpense) {
    // SWR fallbackData is rendered before it is necessarily present in the cache.
    await mutate((current = expenses) => [expense, ...current.filter(row => row.id !== expense.id)], { revalidate: false });
    setView("records"); setPeriod("month"); setAnchor(expense.date); setQuery(""); setCategory(""); pagination.onPageChange(1);
  }
  async function removeExpense(id: string) {
    await mutate((current = expenses) => current.filter(row => row.id !== id), { revalidate: false });
  }
  return { view, setView, period, setPeriod, anchor, setAnchor, query, setQuery, category, setCategory, editor, setEditor, visible, summary, trend, range, pagination, error, hasFilters, resetFilters, revealSavedExpense, removeExpense };
}

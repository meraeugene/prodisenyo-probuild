"use client";
import { useMemo } from "react";
import useSWR from "swr";
import { getGmeaDashboardDataAction } from "@/actions/gmeaDashboard";
import type { GmeaDashboardData } from "../types";
import { buildGmeaDashboardSummary, buildGmeaDashboardTrend } from "../utils/gmeaDashboardSelectors";

export function useGmeaDashboard(initialData: GmeaDashboardData) {
  const { data = initialData, error } = useSWR("gmea-dashboard:overview", getGmeaDashboardDataAction,
    { fallbackData: initialData, refreshInterval: 5000, revalidateOnFocus: true, revalidateOnReconnect: true, refreshWhenHidden: false });
  const summary = useMemo(() => buildGmeaDashboardSummary(data), [data]);
  const month = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }).slice(0, 7);
  const trend = useMemo(() => buildGmeaDashboardTrend(data, month), [data, month]);
  return { data, summary, trend, error };
}

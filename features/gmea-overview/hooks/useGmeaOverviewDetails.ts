"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { getGmeaOverviewDataAction } from "@/actions/gmeaOverview";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import type { GmeaOverviewData, GmeaOverviewMetric } from "../types";
import { buildGmeaOverviewRecords } from "../utils/gmeaOverviewRecords";
import { buildGmeaOverviewMetricTotals, selectGmeaOverviewMetricRecords } from "../utils/gmeaOverviewMetrics";

export function useGmeaOverviewDetails(initialData: GmeaOverviewData, metric: GmeaOverviewMetric, canEdit: boolean) {
  const { data = initialData } = useSWR("gmea-overview:data", getGmeaOverviewDataAction, {
    fallbackData: initialData, revalidateOnFocus: !canEdit, refreshInterval: canEdit ? 0 : 30000,
  });
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState("all");
  const records = useMemo(() => buildGmeaOverviewRecords(data), [data]);
  const totals = useMemo(() => buildGmeaOverviewMetricTotals(records), [records]);
  const count = useMemo(() => selectGmeaOverviewMetricRecords(records, metric).length, [records, metric]);
  const visible = useMemo(() => selectGmeaOverviewMetricRecords(records, metric, query, division), [records, metric, query, division]);
  const filteredTotals = useMemo(() => buildGmeaOverviewMetricTotals(visible), [visible]);
  const pagination = useTablePagination(visible, JSON.stringify([metric, query, division]));
  const hasFilters = query !== "" || division !== "all";
  return {
    query, setQuery, division, setDivision, totals, count, visible, filteredTotals, pagination, hasFilters,
    reset: () => { setQuery(""); setDivision("all"); },
  };
}

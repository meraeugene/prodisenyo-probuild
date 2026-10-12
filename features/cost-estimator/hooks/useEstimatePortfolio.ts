import { useMemo, useState } from "react";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import type { AssignedEstimateProject, ProjectEstimateItemRow, ProjectEstimateRow } from "../types";
import { buildEstimatePortfolio, selectEstimatePortfolio, ESTIMATE_PORTFOLIO_TABS, type EstimatePortfolioSort, type EstimatePortfolioStatus } from "../utils/estimatePortfolio";

export function useEstimatePortfolio(estimates: ProjectEstimateRow[], projects: AssignedEstimateProject[], items: Record<string, ProjectEstimateItemRow[]>) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<EstimatePortfolioStatus>("all");
  const [sort, setSort] = useState<EstimatePortfolioSort>("recent");
  const entries = useMemo(() => buildEstimatePortfolio(estimates, projects, items), [estimates, projects, items]);
  const rows = useMemo(() => selectEstimatePortfolio(entries, status, query, sort), [entries, status, query, sort]);
  const pagination = useTablePagination(rows, JSON.stringify([status, query, sort]));
  const tabs = ESTIMATE_PORTFOLIO_TABS.map(tab => ({ ...tab, count: tab.value === "all" ? entries.length : entries.filter(entry => entry.status === tab.value).length }));
  const count = (value: EstimatePortfolioStatus) => tabs.find(tab => tab.value === value)?.count ?? 0;
  return { query, setQuery, status, setStatus, sort, setSort, rows, entries, tabs, pagination, count,
    hasFilters: query !== "" || status !== "all" || sort !== "recent",
    reset: () => { setQuery(""); setStatus("all"); setSort("recent"); },
  };
}

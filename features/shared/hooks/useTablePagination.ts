import { useState } from "react";
import { TABLE_PAGE_SIZE } from "@/features/shared/pagination";

export function useTablePagination<T>(rows: T[], filterKey: string) {
  const [state, setState] = useState({ page: 1, filterKey });
  if (state.filterKey !== filterKey) setState({ ...state, page: 1, filterKey });
  const pageSize = TABLE_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = state.filterKey === filterKey ? Math.max(1, Math.min(state.page, totalPages)) : 1;
  return {
    page, totalPages, pageSize,
    pageRows: rows.slice((page - 1) * pageSize, page * pageSize),
    onPageChange: (value: number) => setState({ ...state, page: Math.max(1, Math.min(value, totalPages)), filterKey }),
  };
}

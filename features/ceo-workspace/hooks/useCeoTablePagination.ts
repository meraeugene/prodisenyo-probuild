import { useState } from "react";

export function useCeoTablePagination<T>(rows: T[], filterKey: string) {
  const [state, setState] = useState({ page: 1, pageSize: 10, filterKey });
  if (state.filterKey !== filterKey) setState({ ...state, page: 1, filterKey });
  const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
  const page = state.filterKey === filterKey ? Math.max(1, Math.min(state.page, totalPages)) : 1;
  return {
    page, totalPages, pageSize: state.pageSize,
    pageRows: rows.slice((page - 1) * state.pageSize, page * state.pageSize),
    onPageChange: (value: number) => setState({ ...state, page: Math.max(1, Math.min(value, totalPages)), filterKey }),
    onPageSizeChange: (value: number) => setState({ page: 1, pageSize: value, filterKey }),
  };
}

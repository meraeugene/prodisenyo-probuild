import { useMemo, useState } from "react";
import type { RentalTransaction } from "../transactionTypes";
import { buildRentalExpensePages, selectRentalExpensePageRows } from "../utils/rentalExpensePages";

export function useRentalExpensePages(rows: RentalTransaction[], filterKey: string) {
  const pages = useMemo(() => buildRentalExpensePages(rows.flatMap(row => row.type === "expense" ? [row.expense] : [])), [rows]);
  const [selection, setSelection] = useState({ filterKey, id: "" });
  if (selection.filterKey !== filterKey) setSelection({ filterKey, id: "" });
  const index = Math.max(0, pages.findIndex(page => selection.filterKey === filterKey && page.id === selection.id));
  const selected = pages[index];
  const pageRows = selectRentalExpensePageRows(rows, selected);
  const select = (id: string) => setSelection({ filterKey, id });
  return { pages, index, selected, pageRows, select, onPageChange: (page: number) => { if (pages[page - 1]) select(pages[page - 1].id); } };
}

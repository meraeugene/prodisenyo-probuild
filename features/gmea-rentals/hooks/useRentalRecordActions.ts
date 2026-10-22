import { useState } from "react";
import { useGmeaCacheRefresh } from "@/features/gmea-forms/hooks/useGmeaCacheRefresh";
import { deleteGmeaRentalIncomeRecordAction } from "@/actions/gmeaRentalRecords";
import { saveGmeaRentalExpenseAction } from "@/actions/gmeaRentals";
import type { RentalExpense } from "../types";
import type { RentalIncomeRecord } from "../incomeTypes";
import { rentalIncomeRecordEdit } from "../utils/rentalIncomeRecordEditing";

export type RentalRecordDeletion = { kind: "expense"; expense: RentalExpense } | { kind: "income"; record: RentalIncomeRecord };
export function useRentalRecordActions(canEdit: boolean) {
  const refresh = useGmeaCacheRefresh();
  const [editingIncome, setEditingIncome] = useState<RentalIncomeRecord>();
  const [deleting, setDeleting] = useState<RentalRecordDeletion>();
  async function removeRecord() {
    if (!canEdit || !deleting) throw new Error("Only GMEA can delete records.");
    if (deleting.kind === "expense") await saveGmeaRentalExpenseAction(deleting.expense.id, deleting.expense.version, { kind: "delete" });
    else await deleteGmeaRentalIncomeRecordAction(rentalIncomeRecordEdit(deleting.record));
    refresh(["gmea-rentals:operations", "gmea-rentals:income-history", "gmea-rentals:list", "gmea-dashboard:overview",
      ...(deleting.kind === "income" ? [["gmea-rental", deleting.record.id]] : [])]);
  }
  return { editingIncome, setEditingIncome, deleting, setDeleting, removeRecord };
}

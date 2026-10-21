import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { deleteGmeaRentalIncomeRecordAction } from "@/actions/gmeaRentalRecords";
import { saveGmeaRentalExpenseAction } from "@/actions/gmeaRentals";
import type { RentalExpense } from "../types";
import type { RentalIncomeRecord } from "../incomeTypes";
import { rentalIncomeRecordEdit } from "../utils/rentalIncomeRecordEditing";

export type RentalRecordDeletion = { kind: "expense"; expense: RentalExpense } | { kind: "income"; record: RentalIncomeRecord };
export function useRentalRecordActions(canEdit: boolean) {
  const router = useRouter();
  const [editingIncome, setEditingIncome] = useState<RentalIncomeRecord>();
  const [deleting, setDeleting] = useState<RentalRecordDeletion>();
  async function removeRecord() {
    if (!canEdit || !deleting) throw new Error("Only GMEA can delete records.");
    if (deleting.kind === "expense") await saveGmeaRentalExpenseAction(deleting.expense.id, deleting.expense.version, { kind: "delete" });
    else await deleteGmeaRentalIncomeRecordAction(rentalIncomeRecordEdit(deleting.record));
    await Promise.allSettled([mutate("gmea-rentals:operations"), mutate("gmea-rentals:income-history"), mutate("gmea-rentals:list"), mutate("gmea-dashboard:overview"), ...(deleting.kind === "income" ? [mutate(["gmea-rental", deleting.record.id])] : [])]);
    router.refresh();
  }
  return { editingIncome, setEditingIncome, deleting, setDeleting, removeRecord };
}

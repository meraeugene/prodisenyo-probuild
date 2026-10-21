"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { createCustomerRentalExpenseAction } from "@/actions/gmeaCustomerIncome";
import {
  saveGmeaRentalAssignmentAction,
  saveGmeaRentalExpenseAction,
  saveGmeaRentalWorkerAction,
} from "@/actions/gmeaRentals";
import type {
  GmeaRental,
  RentalAssignmentMutation,
  RentalExpense,
  RentalExpenseMutation,
  RentalWorker,
  RentalWorkerMutation,
} from "../types";

export function useGmeaRentalOperationsMutation(rental?: GmeaRental, incomeRecordId?: string) {
  const router = useRouter();
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function run(operation: () => Promise<unknown>, message: string) {
    if (saving.current) throw new Error("A save is already in progress.");
    saving.current = true;
    setPending(true);
    setError("");
    try {
      await operation();
      toast.success(message);
      await Promise.allSettled([mutate("gmea-rentals:operations"), mutate("gmea-dashboard:overview"), mutate("gmea-input-options"), ...(rental ? [mutate(["gmea-rental", rental.id])] : [])]);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save changes.",
      );
      throw cause;
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return {
    pending,
    error,
    saveWorker: (worker: RentalWorker | null, input: RentalWorkerMutation) =>
      run(() =>
        saveGmeaRentalWorkerAction(
          worker?.id ?? null,
          worker?.version ?? null,
          input,
        ), input.kind === "create" ? "Worker added successfully." : "Worker updated successfully.",
      ),
    saveAssignment: (input: RentalAssignmentMutation) => {
      if (!rental) throw new Error("Open a rental before assigning a worker.");
      return run(() =>
        saveGmeaRentalAssignmentAction(rental.id, rental.version, input),
        input.kind === "assign_worker" ? "Worker assigned successfully." : "Worker assignment removed.",
      );
    },
    saveExpense: (
      expense: RentalExpense | null,
      input: RentalExpenseMutation,
    ) =>
      run(() =>
        incomeRecordId && !expense ? createCustomerRentalExpenseAction(incomeRecordId, input) : saveGmeaRentalExpenseAction(
          expense?.id ?? null,
          expense?.version ?? null,
          input,
        ), input.kind === "create" ? "Rental expense added successfully." : input.kind === "delete" ? "Rental expense deleted." : "Rental expense updated successfully.",
      ),
  };
}

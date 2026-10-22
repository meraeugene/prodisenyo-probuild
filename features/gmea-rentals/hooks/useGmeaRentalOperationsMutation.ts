"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useGmeaCacheRefresh } from "@/features/gmea-forms/hooks/useGmeaCacheRefresh";
import type { GmeaInputValues } from "@/features/gmea-inputs/types";
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
  const refresh = useGmeaCacheRefresh();
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function run(operation: () => Promise<unknown>, message: string, savedInputs?: GmeaInputValues) {
    if (saving.current) throw new Error("A save is already in progress.");
    saving.current = true;
    setPending(true);
    setError("");
    try {
      await operation();
      toast.success(message);
      refresh([...(rental ? [["gmea-rental", rental.id]] : []), "gmea-rentals:operations", "gmea-dashboard:overview"], savedInputs);
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
        input.kind === "delete" ? undefined : { suppliers: input.value.supplier, methods: input.value.method },
      ),
  };
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mutate } from "swr";
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

export function useGmeaRentalOperationsMutation(rental?: GmeaRental) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function run(operation: () => Promise<unknown>) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await operation();
      await mutate("gmea-rentals:operations");
      if (rental) await mutate(["gmea-rental", rental.id]);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save changes.",
      );
      throw cause;
    } finally {
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
        ),
      ),
    saveAssignment: (input: RentalAssignmentMutation) => {
      if (!rental) throw new Error("Open a rental before assigning a worker.");
      return run(() =>
        saveGmeaRentalAssignmentAction(rental.id, rental.version, input),
      );
    },
    saveExpense: (
      expense: RentalExpense | null,
      input: RentalExpenseMutation,
    ) =>
      run(() =>
        saveGmeaRentalExpenseAction(
          expense?.id ?? null,
          expense?.version ?? null,
          input,
        ),
      ),
  };
}

"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useGmeaCacheRefresh } from "@/features/gmea-forms/hooks/useGmeaCacheRefresh";
import { saveGmeaRentalCollectionAction } from "@/actions/gmeaRentals";
import type { GmeaRental, RentalCollectionMutation } from "../types";

export function useGmeaRentalCollectionMutation(rental: GmeaRental) {
  const refresh = useGmeaCacheRefresh();
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function save(command: RentalCollectionMutation) {
    if (saving.current) throw new Error("A save is already in progress.");
    saving.current = true;
    setPending(true);
    setError("");
    try {
      await saveGmeaRentalCollectionAction(rental.id, rental.version, command);
      toast.success(command.kind === "record_payment" ? "Rental payment added successfully." : "Rental payment voided successfully.");
      refresh([["gmea-rental", rental.id], "gmea-rentals:list", "gmea-rentals:income-history", "gmea-dashboard:overview"],
        command.kind === "record_payment" ? { methods: command.value.method } : undefined);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Unable to save payment.";
      setError(message);
      throw cause;
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return { save, pending, error };
}

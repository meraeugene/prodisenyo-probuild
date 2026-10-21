"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { saveGmeaRentalCollectionAction } from "@/actions/gmeaRentals";
import type { GmeaRental, RentalCollectionMutation } from "../types";

export function useGmeaRentalCollectionMutation(rental: GmeaRental) {
  const router = useRouter();
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
      await Promise.allSettled([mutate(["gmea-rental", rental.id]), mutate("gmea-rentals:list"), mutate("gmea-dashboard:overview"), mutate("gmea-input-options")]);
      router.refresh();
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

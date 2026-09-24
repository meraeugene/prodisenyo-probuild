"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mutate } from "swr";
import { saveGmeaRentalCollectionAction } from "@/actions/gmeaRentals";
import type { GmeaRental, RentalCollectionMutation } from "../types";

export function useGmeaRentalCollectionMutation(rental: GmeaRental) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function save(command: RentalCollectionMutation) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await saveGmeaRentalCollectionAction(rental.id, rental.version, command);
      await mutate(["gmea-rental", rental.id]);
      router.refresh();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Unable to save payment.";
      setError(message);
      throw cause;
    } finally {
      setPending(false);
    }
  }

  return { save, pending, error };
}

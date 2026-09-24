"use client";

import { useState } from "react";
import type { GmeaRental, RentalPayment } from "../types";
import { rentalInputClass } from "../utils/rentalUi";
import { useGmeaRentalCollectionMutation } from "../hooks/useGmeaRentalCollectionMutation";
import GmeaRentalsDialog from "./GmeaRentalsDialog";

export default function GmeaRentalVoidPaymentForm({
  rental,
  payment,
  onClose,
}: {
  rental: GmeaRental;
  payment: RentalPayment;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const { save, pending, error } = useGmeaRentalCollectionMutation(rental);

  function submit() {
    void save({
      kind: "void_payment",
      payment_id: payment.id,
      reason,
    })
      .then(onClose)
      .catch(() => undefined);
  }

  return (
    <GmeaRentalsDialog
      title="Void payment?"
      description="The original payment remains in the audit history and will no longer count toward received totals."
      onClose={onClose}
      onSave={submit}
      pending={pending}
      error={error}
      saveLabel="Void payment"
    >
      <label className="block space-y-1.5 text-sm font-medium text-slate-700">
        <span>Reason *</span>
        <textarea
          required
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className={rentalInputClass + " min-h-24 py-3"}
        />
      </label>
    </GmeaRentalsDialog>
  );
}

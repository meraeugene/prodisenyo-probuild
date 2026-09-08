"use client";

import { useState } from "react";
import type { ContractReceipt, GmeaProject } from "../types";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import { TextField } from "./GmeaFields";

export default function GmeaVoidReceiptForm({
  project,
  receipt,
  onClose,
}: {
  project: GmeaProject;
  receipt: ContractReceipt;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const save = useGmeaMutation(project);
  return (
    <GmeaDialog
      title="Void payment?"
      description="The original record will remain in the audit history and will no longer count toward received totals."
      onClose={onClose}
      onSave={() => save({ kind: "void_receipt", receipt_id: receipt.id, reason })}
      saveLabel="Void payment"
      danger
      compact
    >
      <TextField
        label="Reason *"
        required
        maxLength={500}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
    </GmeaDialog>
  );
}

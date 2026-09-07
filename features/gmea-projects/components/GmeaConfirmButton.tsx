"use client";
import { useState } from "react";
import GmeaDialog from "./GmeaDialog";
import { secondaryClass } from "../utils/gmeaConstants";

export default function GmeaConfirmButton({
  label,
  description,
  onConfirm,
  danger = false,
}: {
  label: string;
  description: string;
  onConfirm: () => Promise<unknown>;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={secondaryClass + (danger ? " text-rose-700" : "")}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {open && (
        <GmeaDialog
          title={label + "?"}
          onClose={() => setOpen(false)}
          onSave={onConfirm}
          saveLabel={label}
        >
          <p className="text-sm text-slate-600">{description}</p>
        </GmeaDialog>
      )}
    </>
  );
}

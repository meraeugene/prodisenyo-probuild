"use client";
import { useState, type ReactNode } from "react";
import GmeaDialog from "./GmeaDialog";
import { secondaryClass } from "../utils/gmeaConstants";

export default function GmeaConfirmButton({
  label,
  description,
  onConfirm,
  danger = false,
  triggerIcon,
}: {
  label: string;
  description: string;
  onConfirm: () => Promise<unknown>;
  danger?: boolean;
  triggerIcon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={triggerIcon ? label : undefined}
        className={
          triggerIcon
            ? "inline-flex size-9 items-center justify-center rounded-lg transition-colors " +
              (danger
                ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900")
            : secondaryClass + (danger ? " text-rose-700" : "")
        }
        onClick={() => setOpen(true)}
      >
        {triggerIcon ?? label}
      </button>
      {open && (
        <GmeaDialog
          title={label + "?"}
          onClose={() => setOpen(false)}
          onSave={onConfirm}
          saveLabel={label}
          compact
          danger={danger}
        >
          <p className="text-sm text-slate-600">{description}</p>
        </GmeaDialog>
      )}
    </>
  );
}

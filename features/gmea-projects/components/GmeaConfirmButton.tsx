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
  triggerLabel,
  compactTrigger = false,
}: {
  label: string;
  description: string;
  onConfirm: () => Promise<unknown>;
  danger?: boolean;
  triggerIcon?: ReactNode;
  triggerLabel?: string;
  compactTrigger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={label}
        className={
          compactTrigger
            ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors " + (danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-600 hover:bg-slate-100")
            : triggerIcon && !triggerLabel
            ? "inline-flex size-9 items-center justify-center rounded-lg transition-colors " +
              (danger
                ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900")
            : danger
              ? "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500 bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:border-rose-600 hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-50"
              : secondaryClass + " gap-2"
        }
        onClick={() => setOpen(true)}
      >
        {triggerIcon}
        {triggerLabel ?? (!triggerIcon ? label : null)}
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

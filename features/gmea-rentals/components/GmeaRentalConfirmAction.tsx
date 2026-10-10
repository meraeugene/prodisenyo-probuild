"use client";
import { useRef, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import GmeaRentalsDialog from "./GmeaRentalsDialog";

export default function GmeaRentalConfirmAction({ label, triggerLabel, description, pendingLabel, onConfirm, icon, className, disabled = false }: {
  label: string; triggerLabel: string; description: string; pendingLabel: string;
  onConfirm: () => Promise<unknown>; icon?: ReactNode; className?: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false), [pending, setPending] = useState(false), [error, setError] = useState("");
  const submitting = useRef(false);
  async function confirm() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true); setError("");
    try { await onConfirm(); setOpen(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to complete this action."); }
    finally { submitting.current = false; setPending(false); }
  }
  return <>
    <button type="button" disabled={disabled || pending} aria-busy={pending} aria-label={label} className={className} onClick={() => { setError(""); setOpen(true); }}>
      {pending ? <LoaderCircle size={14} className="shrink-0 animate-spin" aria-hidden="true" /> : icon}{pending ? pendingLabel : triggerLabel}
    </button>
    {open && <GmeaRentalsDialog compact title={`${label}?`} description={description} pending={pending} pendingLabel={pendingLabel} error={error} danger saveLabel={triggerLabel} onClose={() => setOpen(false)} onSave={() => void confirm()}>
      <p className="text-sm text-slate-600">Choose {triggerLabel.toLowerCase()} to continue, or Cancel to keep the record unchanged.</p>
    </GmeaRentalsDialog>}
  </>;
}

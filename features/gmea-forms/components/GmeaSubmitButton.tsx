"use client";

import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { useGmeaEntrySession } from "./GmeaEntrySession";

export default function GmeaSubmitButton({ pending, addingAgain, pendingLabel = "Saving…", children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  pending: boolean; addingAgain?: boolean; pendingLabel?: string;
}) {
  const session = useGmeaEntrySession();
  const busy = pending && !(addingAgain ?? session?.addingAgain());
  return <button {...props} type="submit" disabled={disabled || pending} aria-busy={busy}>
    {busy && <LoaderCircle size={16} className="shrink-0 animate-spin" aria-hidden="true" />}
    {busy ? pendingLabel : children}
  </button>;
}

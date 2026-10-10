"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteGmeaRentalRecordAction } from "@/actions/gmeaRentalDeletion";
import GmeaRentalsDialog from "./GmeaRentalsDialog";

export default function GmeaRentalDeleteButton({ kind, id, version, name, detail = false }: {
  kind: "rental" | "equipment"; id: string; version: number; name: string; detail?: boolean;
}) {
  const [open, setOpen] = useState(false), [pending, setPending] = useState(false), [error, setError] = useState("");
  const router = useRouter();
  const { mutate } = useSWRConfig();
  async function remove() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await deleteGmeaRentalRecordAction(kind, id, version);
      setOpen(false);
      if (detail) router.replace("/gmea-rentals");
      await Promise.all([mutate("gmea-rentals:list"), mutate("gmea-rentals:equipment"), mutate("gmea-rentals:operations")]);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete this record.");
    } finally {
      setPending(false);
    }
  }
  return <>
    <button type="button" disabled={pending} aria-busy={pending} aria-label={pending ? `Deleting ${kind}: ${name}` : `Delete ${kind}: ${name}`} className="inline-flex min-h-9 items-center gap-1.5 rounded px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60" onClick={() => { setError(""); setOpen(true); }}>{pending ? <LoaderCircle size={14} className="shrink-0 animate-spin" aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}{pending ? "Deleting…" : "Delete"}</button>
    {open && <GmeaRentalsDialog compact title={`Delete ${kind}?`} description={`Remove ${name}.`} pending={pending} error={error} saveLabel="Delete" danger onClose={() => setOpen(false)} onSave={() => void remove()}>
      <p className="text-sm text-slate-600">{kind === "rental" ? "This permanently deletes the rental, its equipment assignments, payment history, and linked expenses. Dashboard totals will be recalculated." : "This permanently deletes the equipment. Equipment linked to rental or expense records must be deactivated instead."}</p>
    </GmeaRentalsDialog>}
  </>;
}

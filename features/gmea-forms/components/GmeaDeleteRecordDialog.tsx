"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import WorkspaceConfirmDialog from "@/components/workspace/WorkspaceConfirmDialog";

export default function GmeaDeleteRecordDialog({ title, description, onDelete, onClose, successMessage = "Record deleted successfully." }: {
  title: string; description: string; onDelete: () => Promise<unknown>; onClose: () => void; successMessage?: string;
}) {
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  const busy = useRef(false);
  async function remove() {
    if (busy.current) return;
    busy.current = true; setPending(true); setError("");
    try { await onDelete(); toast.success(successMessage); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to delete this record."); }
    finally { busy.current = false; setPending(false); }
  }
  return <WorkspaceConfirmDialog title={title} description={description} confirmLabel={pending ? "Deleting…" : "Delete"} danger pending={pending} onConfirm={() => void remove()} onClose={onClose}>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
  </WorkspaceConfirmDialog>;
}

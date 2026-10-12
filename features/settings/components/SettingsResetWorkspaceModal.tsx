"use client";
import WorkspaceConfirmDialog from "@/components/workspace/WorkspaceConfirmDialog";

export default function SettingsResetWorkspaceModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  return <WorkspaceConfirmDialog open={open} title="Reset workspace data?" description="Remove locally stored workspace data from this device. This action cannot be undone." confirmLabel="Delete workspace data" danger onClose={onClose} onConfirm={onConfirm}>
    <div className="rounded border border-rose-100 bg-rose-50 p-4 text-sm leading-6 text-rose-800"><p className="font-medium">The following local data will be deleted:</p><ul className="mt-2 list-disc pl-5"><li>Uploaded attendance and employee records</li><li>Generated payroll results and edits</li><li>Role rates and paid holidays</li><li>Saved filters and workspace state</li></ul></div>
  </WorkspaceConfirmDialog>;
}

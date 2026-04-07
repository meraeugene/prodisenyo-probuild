"use client";

import { Trash2Icon, TriangleAlert, X } from "lucide-react";

interface SettingsResetWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SettingsResetWorkspaceModal({
  open,
  onClose,
  onConfirm,
}: SettingsResetWorkspaceModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-screen items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-apple-mist bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <TriangleAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-apple-charcoal">
                Reset workspace data?
              </h2>
              <p className="mt-1 text-sm text-apple-smoke">
                This will remove locally stored payroll workspace data from this
                device.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-apple-smoke transition hover:bg-apple-snow hover:text-apple-charcoal"
            aria-label="Close reset confirmation"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/70 p-4">
          <p className="text-sm font-semibold text-red-700">
            The following data will be deleted:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-red-700/90">
            <li>Uploaded attendance records and employee data</li>
            <li>Generated payroll results and payroll edits</li>
            <li>Edited role rates and paid holidays</li>
            <li>Saved filters and locally stored workspace state</li>
          </ul>
        </div>

        <p className="mt-4 text-sm text-apple-steel">
          This action cannot be undone unless you upload the files and rebuild
          the workspace again.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-[12px] border border-apple-silver px-4 text-sm font-semibold text-apple-ash transition hover:border-apple-charcoal"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-11 items-center rounded-[12px] bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            Delete Workspace Data
          </button>
        </div>
      </div>
    </div>
  );
}

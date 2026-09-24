"use client";

import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import {
  rentalPrimaryButtonClass,
  rentalSecondaryButtonClass,
} from "../utils/rentalUi";

export default function GmeaRentalsDialog({
  title,
  description,
  children,
  onClose,
  onSave,
  pending,
  error,
  saveLabel,
  wide = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  onSave: () => void;
  pending: boolean;
  error?: string;
  saveLabel: string;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && !pending && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[150] bg-slate-950/45 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby="gmea-rentals-dialog-description"
          onInteractOutside={(event) => event.preventDefault()}
          className={
            "fixed inset-x-0 bottom-0 z-[151] mx-auto flex max-h-[95dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:bottom-auto sm:top-1/2 sm:w-[calc(100%-2rem)] sm:-translate-y-1/2 sm:rounded-2xl " +
            (wide ? "sm:max-w-5xl" : "sm:max-w-4xl")
          }
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
            <div>
              <Dialog.Title className="text-2xl font-semibold tracking-tight text-slate-900">
                {title}
              </Dialog.Title>
              <Dialog.Description
                id="gmea-rentals-dialog-description"
                className="mt-1 text-sm text-slate-500"
              >
                {description}
              </Dialog.Description>
            </div>
            <button
              type="button"
              aria-label="Close dialog"
              disabled={pending}
              onClick={onClose}
              className={rentalSecondaryButtonClass + " !h-10 !px-3"}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
            {children}
          </div>

          <footer className="shrink-0 space-y-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
              >
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={onClose}
                className={rentalSecondaryButtonClass}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={onSave}
                className={rentalPrimaryButtonClass}
              >
                {pending ? "Saving…" : saveLabel}
              </button>
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

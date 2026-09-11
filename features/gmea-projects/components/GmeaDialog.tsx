"use client";
import { useState, type ReactNode, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { LoaderCircle, Save, Trash2, X } from "lucide-react";
import { buttonClass, secondaryClass } from "../utils/gmeaConstants";

export default function GmeaDialog({
  title,
  description,
  children,
  onClose,
  onSave,
  saveLabel = "Save changes",
  compact = false,
  wide = false,
  danger = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  onSave?: () => Promise<unknown>;
  saveLabel?: string;
  compact?: boolean;
  wide?: boolean;
  danger?: boolean;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!onSave || pending) return;
    setPending(true);
    setError("");
    try {
      await onSave();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save. Try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[150] bg-slate-950/45 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={description ? "gmea-dialog-description" : undefined}
          onEscapeKeyDown={(e) => {
            if (pending) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
          className={
            "fixed inset-x-0 bottom-0 z-[151] mx-auto flex max-h-[95dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:bottom-auto sm:top-1/2 sm:w-[calc(100%-2rem)] sm:-translate-y-1/2 sm:rounded-2xl " +
            (compact
              ? "sm:max-w-md"
              : wide
                ? "sm:max-w-5xl"
                : "sm:max-w-4xl")
          }
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
            <div>
              <Dialog.Title className="text-2xl font-semibold tracking-tight text-slate-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description
                  id="gmea-dialog-description"
                  className="mt-1 text-sm text-slate-500"
                >
                  {description}
                </Dialog.Description>
              )}
            </div>
            <button
              type="button"
              aria-label="Close dialog"
              disabled={pending}
              onClick={onClose}
              className={secondaryClass}
            >
              <X size={18} />
            </button>
          </header>
          <form
            onSubmit={submit}
            className="flex min-h-0 min-w-0 flex-1 flex-col"
          >
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-5 sm:p-7">
              <fieldset disabled={pending} className="min-w-0 space-y-5">
                {children}
              </fieldset>
            </div>
            {onSave && (
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
                    className={secondaryClass + " gap-2"}
                    onClick={onClose}
                  >
                    <X size={15} aria-hidden="true" /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className={
                      danger
                        ? "inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
                        : buttonClass
                    }
                  >
                    {pending && (
                      <LoaderCircle className="animate-spin" size={16} />
                    )}
                    {!pending && (danger ? <Trash2 size={16} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />)}
                    {pending ? "Saving…" : saveLabel}
                  </button>
                </div>
              </footer>
            )}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

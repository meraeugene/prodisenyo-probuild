"use client";

import { useState, useTransition } from "react";
import {
  Check,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import DashboardPageHero from "@/components/DashboardPageHero";
import { resetWorkspaceDataAction } from "@/actions/resetData";

export default function ResetDataPageClient() {
  const [confirmation, setConfirmation] = useState("");
  const [preservePayroll, setPreservePayroll] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canReset = confirmation.trim().toUpperCase() === "RESET";

  function handleResetData() {
    if (!canReset || isPending) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await resetWorkspaceDataAction({ preservePayroll });
        toast.success("Workspace data reset completed.", {
          description: `Cleared ${result.clearedTables} tables. ${result.preservedPayroll ? "Payroll data and user accounts were preserved." : "User accounts were preserved."}`,
        });
        setConfirmation("");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to reset workspace data.",
        );
      }
    });
  }

  return (
    <div className="space-y-5 p-0 sm:p-6">
      <DashboardPageHero
        eyebrow="CEO Admin"
        title="Reset Workspace Data"
        description="Permanently clears records. User accounts are preserved."
      />

      <section className="overflow-hidden rounded-none border border-red-200 bg-white shadow-[0_16px_45px_rgba(127,29,29,0.08)] sm:rounded-[20px]">
        <div className="border-b border-red-100 bg-[linear-gradient(135deg,#fff7f7_0%,#fff_65%)] px-5 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-red-900">Danger Zone</h2>
                <span className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-700">
                  Irreversible
                </span>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-red-800/80">
                This removes projects, progress, attendance, overtime, estimates,
                budgets, employees, sites, catalogs, and request logs from the
                database. Back up the database before continuing.
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-900">
                <Check size={16} />
                Preserved: auth users, profile accounts
                {preservePayroll ? ", and payroll records." : "."}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-5 mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:mx-7 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
          <div className="flex items-start gap-3">
            <div>
              <p className="text-sm font-bold text-apple-charcoal">
              Keep payroll data
              </p>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-apple-smoke">
                Preserve payroll runs, employee payroll items, daily totals,
                adjustments, and their linked attendance imports.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span
              className={`min-w-7 text-right text-xs font-bold uppercase tracking-[0.12em] ${preservePayroll ? "text-[#076d69]" : "text-slate-500"}`}
            >
              {preservePayroll ? "On" : "Off"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={preservePayroll}
              aria-label="Keep payroll data during reset"
              disabled={isPending}
              onClick={() => setPreservePayroll((current) => !current)}
              className={`relative h-9 w-[4.25rem] shrink-0 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076d69] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${preservePayroll ? "border-[#076d69] bg-[#076d69]" : "border-slate-300 bg-slate-200"}`}
            >
              <span
                aria-hidden="true"
                className={`absolute left-0.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_5px_rgba(15,23,42,0.2)] transition-transform ${preservePayroll ? "translate-x-8" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-apple-charcoal" htmlFor="confirm-reset">
                Confirm this action
              </label>
              <p className="text-sm text-apple-smoke">
                Type <span className="font-mono font-bold text-red-700">RESET</span> to unlock the reset button.
              </p>
              <input
                id="confirm-reset"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="Type RESET"
                autoComplete="off"
                className="mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-apple-charcoal outline-none transition placeholder:font-sans placeholder:font-normal placeholder:tracking-normal focus:border-red-400 focus:ring-4 focus:ring-red-100"
              />
            </div>

            <button
              type="button"
              onClick={handleResetData}
              disabled={!canReset || isPending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(220,38,38,0.18)] transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:min-w-40"
            >
              {isPending ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Clearing data...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Reset Data
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

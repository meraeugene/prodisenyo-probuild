"use client";

import { useMemo, useState, useTransition } from "react";
import PayrollBranchRateTable from "./PayrollBranchRateTable";
import { PayrollPageControls } from "./PayrollPageControls";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveEmployeeBranchRatesAction } from "@/actions/payrollRates";
import type { UsePayrollStateResult } from "@/features/payroll/hooks/usePayrollState";
import {
  extractSiteName,
  formatPayrollNumber,
} from "@/features/payroll/utils/payrollFormatters";
import { buildEmployeeBranchRateKey } from "@/features/payroll/utils/payrollMappers";
import {
  DEFAULT_REGULAR_PAID_HOURS,
  normalizeEmployeeBranchRateConfig,
} from "@/features/payroll/utils/branchRateConfig";

interface PayrollRateModalProps {
  payroll: UsePayrollStateResult;
}

export default function PayrollRateModal({ payroll }: PayrollRateModalProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPage, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState<"all" | "multi">("all");

  const editableRows = useMemo(
    () =>
      payroll.payrollBaseComputedRows
        .map((row) => ({
          worker: row.worker,
          role: row.role,
          site: row.site,
          siteLabel: extractSiteName(row.site) || row.site,
          key: buildEmployeeBranchRateKey(row.worker, row.role, row.site),
          fallbackRate: Number(
            ((row.customRate ?? row.defaultRate) * 8).toFixed(2),
          ),
          fallbackRegularPaidHours: DEFAULT_REGULAR_PAID_HOURS,
        }))
        .sort((a, b) => {
          const byWorker = a.worker.localeCompare(b.worker);
          if (byWorker !== 0) return byWorker;
          const bySite = a.siteLabel.localeCompare(b.siteLabel);
          if (bySite !== 0) return bySite;
          return a.role.localeCompare(b.role);
        }),
    [payroll.payrollBaseComputedRows],
  );

  const branchCountByEmployee = useMemo(
    () =>
      editableRows.reduce<Map<string, number>>((map, row) => {
        const key = row.worker.trim().toLowerCase();
        map.set(key, (map.get(key) ?? 0) + 1);
        return map;
      }, new Map()),
    [editableRows],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    return editableRows.filter((row) => {
      const isMultiBranch =
        (branchCountByEmployee.get(row.worker.trim().toLowerCase()) ?? 0) > 1;

      if (branchFilter === "multi" && !isMultiBranch) {
        return false;
      }

      if (!normalizedQuery) return true;

      return (
        row.worker.toLowerCase().includes(normalizedQuery) ||
        row.role.toLowerCase().includes(normalizedQuery) ||
        row.siteLabel.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [editableRows, searchTerm, branchFilter, branchCountByEmployee]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / 5));
  const page = Math.min(selectedPage, totalPages);
  const visibleRows = filteredRows.slice((page - 1) * 5, page * 5);

  if (!payroll.showPayrollRateModal) return null;

  function handleSave() {
    startTransition(async () => {
      try {
        const changedSummaries: string[] = [];
        const changedEntries = editableRows
          .map((row) => {
            const nextConfig = normalizeEmployeeBranchRateConfig(
              payroll.payrollRateDraft[row.key],
              row.fallbackRate,
            );
            const currentConfig = normalizeEmployeeBranchRateConfig(
              payroll.employeeBranchRates[row.key],
              row.fallbackRate,
            );
            const nextDailyRate = nextConfig.dailyRate;
            const currentDailyRate = currentConfig.dailyRate;
            const nextRegularPaidHours = nextConfig.regularPaidHours;
            const currentRegularPaidHours = currentConfig.regularPaidHours;
            const nextOvertimeMultiplier = nextConfig.overtimeMultiplier;
            const currentOvertimeMultiplier = currentConfig.overtimeMultiplier;

            if (
              Math.abs(nextDailyRate - currentDailyRate) < 0.005 &&
              Math.abs(nextRegularPaidHours - currentRegularPaidHours) < 0.005 &&
              Math.abs(nextOvertimeMultiplier - currentOvertimeMultiplier) < 0.00005
            ) {
              return null;
            }

            const dailyRateChanged =
              Math.abs(nextDailyRate - currentDailyRate) >= 0.005;
            const regularHoursChanged =
              Math.abs(nextRegularPaidHours - currentRegularPaidHours) >=
              0.005;
            const overtimeMultiplierChanged =
              Math.abs(nextOvertimeMultiplier - currentOvertimeMultiplier) >=
              0.00005;
            const changeDetails = [
              dailyRateChanged
                ? `daily rate ${formatPayrollNumber(currentDailyRate)} to ${formatPayrollNumber(nextDailyRate)}`
                : null,
              regularHoursChanged
                ? `regular paid hours ${formatPayrollNumber(currentRegularPaidHours)}h to ${formatPayrollNumber(nextRegularPaidHours)}h`
                : null,
              overtimeMultiplierChanged
                ? `OT multiplier ${formatPayrollNumber(currentOvertimeMultiplier)}x to ${formatPayrollNumber(nextOvertimeMultiplier)}x`
                : null,
            ].filter(Boolean);

            changedSummaries.push(
              `${row.worker} at ${row.siteLabel}: ${changeDetails.join(", ")}`,
            );

            return {
              employeeName: row.worker,
              roleCode: row.role,
              siteName: row.site,
              dailyRate: nextDailyRate,
              regularPaidHours: nextRegularPaidHours,
              overtimeMultiplier: nextOvertimeMultiplier,
            };
          })
          .filter((entry): entry is NonNullable<typeof entry> =>
            Boolean(entry),
          );

        if (changedEntries.length === 0) {
          toast.info("No branch rate changes to save.");
          return;
        }

        const result = await saveEmployeeBranchRatesAction(changedEntries);

        payroll.setEmployeeBranchRates({ ...payroll.payrollRateDraft });
        payroll.applyPayrollRates();
        const primaryMessage =
          result.saved === 1
            ? "Branch rate saved."
            : `${result.saved} branch rates saved.`;

        const extraCount = changedSummaries.length - 1;
        const description =
          changedSummaries.length > 0
            ? `${changedSummaries.slice(0, 3).join(" | ")}${
                extraCount > 2
                  ? ` | +${extraCount - 2} more change${extraCount - 2 === 1 ? "" : "s"}`
                  : ""
              }`
            : "The employee's branch-specific rate was updated.";

        toast.success(primaryMessage, {
          description,
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to save branch rates.",
        );
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid items-center justify-items-center overflow-hidden bg-black/40 p-4 sm:p-6 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="branch-rate-title" className="flex max-h-[min(85dvh,720px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-apple-xs sm:p-6">
        <div className="shrink-0">
          <h3 id="branch-rate-title" className="text-lg font-bold text-apple-charcoal">
            Edit Employee Rates Per Branch
          </h3>
          <p className="text-sm text-apple-smoke">
            The standard daily rate is 500 for all employees. You can override
            it here per employee and branch, and those saved rates will be
            reused the next time payroll is generated for the same employee at
            the same site.
          </p>
        </div>

        <div className="mt-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-md">
              <input data-search-field="true"
                type="text"
                value={searchTerm}
                onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }}
                placeholder="Search employee, role, or branch"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-3 pr-4 text-sm text-apple-charcoal transition-all focus:border-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15"
              />
            </div>

            <div className="inline-flex rounded-2xl border border-slate-200 bg-apple-snow/70 p-1">
              <button
                type="button"
                onClick={() => { setBranchFilter("all"); setPage(1); }}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  branchFilter === "all"
                    ? "bg-teal-700 text-white"
                    : "text-apple-ash hover:bg-white"
                }`}
              >
                All Employees
              </button>
              <button
                type="button"
                onClick={() => { setBranchFilter("multi"); setPage(1); }}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  branchFilter === "multi"
                    ? "bg-teal-700 text-white"
                    : "text-apple-ash hover:bg-white"
                }`}
              >
                Multi-branch Only
              </button>
            </div>
          </div>

          <p className="text-xs text-apple-steel">
            Showing {filteredRows.length} of {editableRows.length} branch rate
            row
            {editableRows.length === 1 ? "" : "s"}
          </p>
        </div>

        <PayrollBranchRateTable rows={visibleRows} payroll={payroll} branchCountByEmployee={branchCountByEmployee} />
        <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-apple-steel">
            Showing {filteredRows.length ? (page - 1) * 5 + 1 : 0}-{Math.min(page * 5, filteredRows.length)} of {filteredRows.length} rows in alphabetical order
          </p>
          <PayrollPageControls page={page} totalPages={totalPages} onChange={setPage} label="Employee branch rate pages" />
        </div>

        <div className="mt-4 flex shrink-0 flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={payroll.closePayrollRateModal}
              className="h-10 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold text-apple-ash transition hover:border-apple-charcoal sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Branch Rates"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

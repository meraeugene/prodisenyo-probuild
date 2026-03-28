"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { saveEmployeeBranchRatesAction } from "@/actions/payrollRates";
import type { UsePayrollStateResult } from "@/features/payroll/hooks/usePayrollState";
import { buildVisiblePages } from "@/features/shared/pagination";
import {
  extractSiteName,
  formatPayrollNumber,
} from "@/features/payroll/utils/payrollFormatters";
import { buildEmployeeBranchRateKey } from "@/features/payroll/utils/payrollMappers";

interface PayrollRateModalProps {
  payroll: UsePayrollStateResult;
}

const BRANCH_RATE_PAGE_SIZE = 5;

export default function PayrollRateModal({ payroll }: PayrollRateModalProps) {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState<"all" | "multi">("all");
  const [page, setPage] = useState(1);

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
        }))
        .sort((a, b) => {
          const bySite = a.siteLabel.localeCompare(b.siteLabel);
          if (bySite !== 0) return bySite;
          const byWorker = a.worker.localeCompare(b.worker);
          if (byWorker !== 0) return byWorker;
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / BRANCH_RATE_PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * BRANCH_RATE_PAGE_SIZE;
  const pageEnd = pageStart + BRANCH_RATE_PAGE_SIZE;
  const paginatedRows = useMemo(
    () => filteredRows.slice(pageStart, pageEnd),
    [filteredRows, pageEnd, pageStart],
  );
  const visiblePages = useMemo(
    () => buildVisiblePages(currentPage, totalPages),
    [currentPage, totalPages],
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, branchFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (!payroll.showPayrollRateModal) return null;

  function handleSave() {
    startTransition(async () => {
      try {
        const entries = editableRows.map((row) => ({
          employeeName: row.worker,
          roleCode: row.role,
          siteName: row.site,
          dailyRate:
            payroll.payrollRateDraft[row.key] ?? row.fallbackRate,
        }));

        const result = await saveEmployeeBranchRatesAction(entries);

        payroll.setEmployeeBranchRates({ ...payroll.payrollRateDraft });
        payroll.applyPayrollRates();
        toast.success(`Saved ${result.saved} branch-specific employee rate(s).`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-apple-mist bg-white p-5 shadow-apple-xs sm:p-6">
        <div>
          <h3 className="text-lg font-bold text-apple-charcoal">
            Edit Employee Rates Per Branch
          </h3>
          <p className="text-sm text-apple-smoke">
            The standard daily rate is 500 for all employees. You can override it here per employee and branch, and those saved rates will be reused the next time payroll is generated for the same employee at the same site.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-apple-silver"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search employee, role, or branch"
                className="h-11 w-full rounded-2xl border border-apple-silver bg-white pl-10 pr-4 text-sm text-apple-charcoal transition-all focus:border-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15"
              />
            </div>

            <div className="inline-flex rounded-2xl border border-apple-mist bg-apple-snow/70 p-1">
              <button
                type="button"
                onClick={() => setBranchFilter("all")}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  branchFilter === "all"
                    ? "bg-emerald-700 text-white"
                    : "text-apple-ash hover:bg-white"
                }`}
              >
                All Employees
              </button>
              <button
                type="button"
                onClick={() => setBranchFilter("multi")}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  branchFilter === "multi"
                    ? "bg-emerald-700 text-white"
                    : "text-apple-ash hover:bg-white"
                }`}
              >
                Multi-branch Only
              </button>
            </div>
          </div>

          <p className="text-xs text-apple-steel">
            Showing {filteredRows.length} of {editableRows.length} branch rate row
            {editableRows.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-apple-mist">
          <table className="min-w-full text-sm">
            <thead className="bg-apple-snow/70">
              <tr className="border-b border-apple-mist">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-apple-steel">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-apple-steel">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-apple-steel">
                  Branch
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-apple-steel">
                  Daily Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row) => (
                  <tr key={row.key} className="border-b border-apple-mist/70 last:border-0">
                    <td className="px-4 py-3 font-medium text-apple-charcoal">
                      <div className="flex items-center gap-2">
                        <span>{row.worker}</span>
                        {(branchCountByEmployee.get(row.worker.trim().toLowerCase()) ?? 0) > 1 ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                            Multi-branch
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-apple-ash">{row.role}</td>
                    <td className="px-4 py-3 text-apple-ash">{row.siteLabel}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={
                          payroll.payrollRateDraft[row.key] ?? row.fallbackRate
                        }
                        onChange={(event) => {
                          const parsed = Number.parseFloat(event.target.value);
                          payroll.setPayrollRateDraft((prev) => ({
                            ...prev,
                            [row.key]:
                              Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
                          }));
                        }}
                        className="h-10 w-full rounded-2xl border border-apple-silver bg-white px-3 text-right text-sm text-apple-charcoal transition-all focus:border-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15"
                      />
                      <p className="mt-1 text-right text-[11px] text-apple-steel">
                        Hourly:{" "}
                        {formatPayrollNumber(
                          (payroll.payrollRateDraft[row.key] ?? row.fallbackRate) / 8,
                        )}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-apple-steel"
                  >
                    No employee branch rates matched your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-sm text-apple-steel">
              Showing {filteredRows.length === 0 ? 0 : pageStart + 1}-
              {Math.min(pageEnd, filteredRows.length)} of {filteredRows.length} rows
            </p>

            {filteredRows.length > BRANCH_RATE_PAGE_SIZE ? (
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 rounded-[10px] border border-apple-silver px-2.5 text-xs font-semibold text-apple-charcoal transition hover:border-[#7ebd8b] disabled:cursor-not-allowed disabled:border-apple-mist disabled:text-apple-silver"
                >
                  First
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 items-center justify-center rounded-[10px] border border-apple-silver px-3 text-xs font-semibold text-apple-charcoal transition hover:border-[#7ebd8b] disabled:cursor-not-allowed disabled:border-apple-mist disabled:text-apple-silver"
                  aria-label="Previous page"
                >
                  <ArrowLeft size={14} />
                </button>

                {visiblePages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`h-8 w-8 rounded-[10px] border text-xs font-semibold transition ${
                      currentPage === pageNumber
                        ? "border-[#1f6a37] bg-[#1f6a37] text-white"
                        : "border-apple-silver text-apple-charcoal hover:border-[#7ebd8b]"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex h-8 items-center justify-center rounded-[10px] border border-apple-silver px-3 text-xs font-semibold text-apple-charcoal transition hover:border-[#7ebd8b] disabled:cursor-not-allowed disabled:border-apple-mist disabled:text-apple-silver"
                  aria-label="Next page"
                >
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 rounded-[10px] border border-apple-silver px-2.5 text-xs font-semibold text-apple-charcoal transition hover:border-[#7ebd8b] disabled:cursor-not-allowed disabled:border-apple-mist disabled:text-apple-silver"
                >
                  Last
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={payroll.closePayrollRateModal}
            className="h-10 rounded-2xl border border-apple-silver px-4 text-sm font-semibold text-apple-ash transition hover:border-apple-charcoal"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
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

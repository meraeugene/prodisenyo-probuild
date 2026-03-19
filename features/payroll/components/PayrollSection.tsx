"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calculator, Search, X } from "lucide-react";
import { highlight } from "@/components/Highlight";
import type { PayrollRow } from "@/lib/payrollEngine";
import { ROLE_CODE_TO_NAME, type RoleCode } from "@/lib/payrollConfig";
import type { Step2Sort } from "@/types";
import type { UsePayrollStateResult } from "@/features/payroll/hooks/usePayrollState";
import { buildVisiblePages } from "@/features/shared/pagination";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";

interface PayrollSectionProps {
  dailyRowsCount: number;
  availableSites: string[];
  payroll: UsePayrollStateResult;
  onGeneratePayroll: () => void;
}

const PAYROLL_PREVIEW_LIMIT = 10;
const EMPLOYEE_NAME_OVERRIDES: Record<string, string> = {
  pbryanm: "bryanmamerto",
};

interface GroupedEmployeePayrollRow {
  name: string;
  sites: PayrollRow[];
  totalHours: number;
  totalPay: number;
}

function normalizeEmployeeName(name: string): string {
  const normalized = name.trim().toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]/g, "");
  return EMPLOYEE_NAME_OVERRIDES[compact] ?? compact;
}

function groupByEmployee(rows: PayrollRow[]): GroupedEmployeePayrollRow[] {
  const grouped = new Map<string, GroupedEmployeePayrollRow>();

  for (const row of rows) {
    const key = normalizeEmployeeName(row.worker);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        name: row.worker,
        sites: [row],
        totalHours: row.hoursWorked,
        totalPay: row.totalPay,
      });
      continue;
    }

    existing.sites.push(row);
    existing.totalHours += row.hoursWorked;
    existing.totalPay += row.totalPay;

    if (row.worker.length > existing.name.length) {
      existing.name = row.worker;
    }
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function summarizeGroupedSites(rows: PayrollRow[]): Array<{
  site: string;
  hours: number;
  pay: number;
}> {
  const summary = new Map<string, { site: string; hours: number; pay: number }>();

  for (const row of rows) {
    const site = row.site || "Unknown Site";
    const existing = summary.get(site);

    if (!existing) {
      summary.set(site, {
        site,
        hours: row.hoursWorked,
        pay: row.totalPay,
      });
      continue;
    }

    existing.hours += row.hoursWorked;
    existing.pay += row.totalPay;
  }

  return Array.from(summary.values()).sort((a, b) => a.site.localeCompare(b.site));
}

export default function PayrollSection({
  dailyRowsCount,
  availableSites,
  payroll,
  onGeneratePayroll,
}: PayrollSectionProps) {
  const groupedPayrollRows = useMemo(
    () => groupByEmployee(payroll.filteredPayrollRows),
    [payroll.filteredPayrollRows],
  );

  const groupedPayrollTotalPages = useMemo(
    () => Math.max(1, Math.ceil(groupedPayrollRows.length / PAYROLL_PREVIEW_LIMIT)),
    [groupedPayrollRows.length],
  );

  const groupedPayrollPage = Math.min(payroll.payrollPage, groupedPayrollTotalPages);
  const groupedPayrollPreviewStart = (groupedPayrollPage - 1) * PAYROLL_PREVIEW_LIMIT;
  const groupedPayrollPreviewEnd = groupedPayrollPreviewStart + PAYROLL_PREVIEW_LIMIT;

  const groupedPayrollPreviewRows = useMemo(
    () =>
      groupedPayrollRows.slice(
        groupedPayrollPreviewStart,
        groupedPayrollPreviewEnd,
      ),
    [groupedPayrollRows, groupedPayrollPreviewStart, groupedPayrollPreviewEnd],
  );

  const groupedPayrollPages = useMemo(
    () => buildVisiblePages(groupedPayrollPage, groupedPayrollTotalPages),
    [groupedPayrollPage, groupedPayrollTotalPages],
  );

  const groupedPayrollTotals = useMemo(
    () =>
      groupedPayrollRows.reduce(
        (acc, row) => {
          acc.hours += row.totalHours;
          acc.pay += row.totalPay;
          return acc;
        },
        { hours: 0, pay: 0 },
      ),
    [groupedPayrollRows],
  );

  useEffect(() => {
    if (payroll.payrollTab !== "payroll") return;
    if (payroll.payrollPage <= groupedPayrollTotalPages) return;
    payroll.setPayrollPage(groupedPayrollTotalPages);
  }, [
    payroll.payrollTab,
    payroll.payrollPage,
    groupedPayrollTotalPages,
    payroll.setPayrollPage,
  ]);

  const payrollActiveRowsCount =
    payroll.payrollTab === "payroll"
      ? groupedPayrollRows.length
      : payroll.payrollActiveRowsCount;
  const payrollPreviewStart =
    payroll.payrollTab === "payroll"
      ? groupedPayrollPreviewStart
      : payroll.payrollPreviewStart;
  const payrollPreviewEnd =
    payroll.payrollTab === "payroll"
      ? groupedPayrollPreviewEnd
      : payroll.payrollPreviewEnd;
  const payrollTotalPages =
    payroll.payrollTab === "payroll"
      ? groupedPayrollTotalPages
      : payroll.payrollTotalPages;
  const payrollPage =
    payroll.payrollTab === "payroll" ? groupedPayrollPage : payroll.payrollPage;
  const payrollPages =
    payroll.payrollTab === "payroll" ? groupedPayrollPages : payroll.payrollPages;

  if (dailyRowsCount === 0) return null;

  return (
    <section
      className="animate-fade-up"
      style={{ animationFillMode: "both", animationDelay: "80ms" }}
    >
      <div className="bg-white rounded-3xl border border-apple-mist shadow-apple-xs overflow-hidden">
        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-apple-mist flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xs font-mono font-semibold text-apple-steel uppercase tracking-widest">
                Step 3
              </span>
              {payroll.payrollGenerated && (
                <span className="text-2xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                  Complete
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-apple-charcoal tracking-tight">
              Generate Payroll
            </h2>
            <p className="text-sm text-apple-smoke mt-1">
              Generate payroll after reviewing attendance logs.
            </p>
            {/* {payroll.payrollSaveNotice && (
              <p className="mt-2 text-xs font-semibold text-green-700">
                {payroll.payrollSaveNotice}
              </p>
            )} */}
          </div>

          {!payroll.payrollGenerated && (
            <button
              type="button"
              onClick={onGeneratePayroll}
              disabled={payroll.payrollRows.length === 0}
              className="px-5 py-3 rounded-2xl bg-apple-charcoal text-white text-sm font-semibold hover:bg-apple-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Calculator size={18} />
              Generate Payroll
            </button>
          )}
        </div>

        {payroll.payrollGenerated && (
          <div className="px-5 sm:px-8 py-6 sm:py-8 space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => payroll.setPayrollTab("payroll")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150
                  ${
                    payroll.payrollTab === "payroll"
                      ? "bg-apple-charcoal text-white border-apple-charcoal"
                      : "bg-white text-apple-charcoal border-apple-silver hover:border-apple-charcoal"
                  }`}
              >
                Payroll Summary
              </button>
              <button
                onClick={() => payroll.setPayrollTab("logs")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150
                  ${
                    payroll.payrollTab === "logs"
                      ? "bg-apple-charcoal text-white border-apple-charcoal"
                      : "bg-white text-apple-charcoal border-apple-silver hover:border-apple-charcoal"
                  }`}
              >
                Attendance Logs
              </button>

              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={payroll.handleExportPayroll}
                  disabled={payroll.filteredPayrollRows.length === 0}
                  className="px-3.5 py-2 rounded-xl border border-apple-silver text-xs font-semibold text-apple-ash hover:border-apple-charcoal transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export Excel
                </button>
                <button
                  type="button"
                  onClick={payroll.openPayrollRateModal}
                  className="px-3.5 py-2 rounded-xl border border-apple-silver text-xs font-semibold text-apple-ash hover:border-apple-charcoal transition"
                >
                  Edit Rates
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <select
                value={payroll.payrollSiteFilter}
                onChange={(e) => payroll.setPayrollSiteFilter(e.target.value)}
                className="w-full px-3 h-10 rounded-2xl border border-apple-silver  hover:border-apple-charcoal cursor-pointer bg-white text-sm text-apple-charcoal
                  focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal transition-all"
              >
                <option value="ALL">All files/sites</option>
                {availableSites.map((siteOption) => (
                  <option key={siteOption} value={siteOption}>
                    {siteOption}
                  </option>
                ))}
              </select>

              <select
                value={payroll.payrollRoleFilter}
                onChange={(e) =>
                  payroll.setPayrollRoleFilter(
                    e.target.value as RoleCode | "ALL",
                  )
                }
                className="w-full h-10 px-3 rounded-2xl border border-apple-silver
focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15
focus:border-apple-charcoal hover:border-apple-charcoal cursor-pointer text-sm text-apple-charcoal bg-white"
              >
                <option value="ALL">All Roles</option>

                {payroll.roleCodes.map((role) => (
                  <option key={role} value={role}>
                    {role} - {ROLE_CODE_TO_NAME[role]}
                  </option>
                ))}
              </select>

              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-silver"
                  size={16}
                />

                <input
                  type="text"
                  value={payroll.payrollNameFilter}
                  onChange={(e) => payroll.setPayrollNameFilter(e.target.value)}
                  placeholder="Search employee... ( / )"
                  id="searchPayrollEmployee"
                  className="w-full  hover:border-apple-charcoal h-10 pl-9 pr-9 rounded-2xl border border-apple-silver 
                    focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal
                    text-sm text-apple-charcoal placeholder:text-apple-silver transition-all"
                />

                {payroll.payrollNameFilter && (
                  <button
                    type="button"
                    onClick={() => payroll.setPayrollNameFilter("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-apple-steel"
                    aria-label="Clear payroll search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <input
                type="date"
                value={payroll.payrollDateFilter}
                onChange={(e) => payroll.setPayrollDateFilter(e.target.value)}
                className="w-full h-10 hover:border-apple-charcoal px-3 rounded-2xl border border-apple-silver
                  focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal
                  text-sm text-apple-charcoal placeholder:text-apple-silver transition-all"
              />

              <select
                value={payroll.payrollSort}
                onChange={(e) =>
                  payroll.setPayrollSort(e.target.value as Step2Sort)
                }
                className="w-full h-10 px-3 rounded-2xl border border-apple-silver
                  focus:outline-none hover:border-apple-charcoal cursor-pointer  focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal
                  text-sm text-apple-charcoal bg-white transition-all"
              >
                <option value="date-asc">Date first (oldest)</option>
                <option value="date-desc">Date first (latest)</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>

              <button
                type="button"
                onClick={payroll.clearPayrollFilters}
                className="w-full h-10 rounded-2xl border border-apple-silver text-sm font-semibold text-apple-ash hover:border-apple-charcoal transition-all"
              >
                Clear Filters
              </button>
            </div>

            {payroll.payrollTab === "payroll" ? (
              <div className="overflow-x-auto rounded-3xl border border-apple-mist bg-white shadow-apple-xs [-webkit-overflow-scrolling:touch]">
                <table className="w-full text-sm table-auto min-w-[900px]">
                  <thead>
                    <tr className="border-b border-apple-mist">
                      {["Employee", "Role", "Site Breakdown", "Rate", "Total Pay", "Edit"].map(
                        (h) => (
                          <th
                            key={h}
                            className={`px-4 py-3.5 text-2xs font-semibold uppercase tracking-widest text-apple-steel ${
                              h === "Rate" || h === "Total Pay"
                                ? "text-right"
                                : h === "Edit"
                                  ? "text-center"
                                  : "text-left"
                            }`}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {groupedPayrollPreviewRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10">
                          <div className="flex flex-col items-center justify-center text-center gap-3 text-apple-steel">
                            <Search size={22} className="text-apple-silver" />

                            <p className="text-sm font-semibold text-apple-charcoal">
                              No employees found
                            </p>

                            <p className="text-xs text-apple-steel max-w-sm">
                              Try clearing filters, searching another name, or
                              changing the date.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      groupedPayrollPreviewRows.map((employee) => {
                        const representativeRow = employee.sites[0] ?? null;
                        const siteBreakdown = summarizeGroupedSites(employee.sites);

                        return (
                          <tr
                            key={representativeRow?.id ?? employee.name}
                            className="border-b border-apple-mist/60 last:border-0 odd:bg-apple-snow/40 hover:bg-apple-snow/70 transition"
                          >
                            <td className="px-4 py-3 text-sm font-semibold text-apple-charcoal">
                              {highlight(employee.name, payroll.payrollNameFilter)}
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-apple-charcoal">
                              {representativeRow?.role ?? "-"}
                            </td>

                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {siteBreakdown.map((siteRow) => (
                                  <div
                                    key={`${employee.name}-${siteRow.site}`}
                                    className="flex items-center justify-between gap-3 text-sm text-apple-smoke"
                                  >
                                    <span className="font-semibold text-apple-charcoal">
                                      {siteRow.site}
                                    </span>
                                    <span className="font-mono text-sm font-semibold text-apple-charcoal">
                                      {formatPayrollNumber(siteRow.hours)} HRS
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-sm font-mono text-apple-ash text-right">
                              {formatPayrollNumber(representativeRow?.rate ?? 0)}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-apple-charcoal font-semibold text-right">
                              {formatPayrollNumber(employee.totalPay)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!representativeRow) return;
                                  payroll.openPayrollEditModal(representativeRow);
                                }}
                                disabled={!representativeRow}
                                className="px-3 py-1.5 rounded-lg border border-apple-silver text-2xs font-semibold text-apple-ash hover:border-apple-charcoal transition"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-apple-silver  bg-apple-charcoal">
                      <td className="px-4 py-3 text-sm font-semibold text-white">
                        Summary
                      </td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-right text-sm font-mono font-semibold text-white">
                        {formatPayrollNumber(groupedPayrollTotals.pay)}
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-apple-mist bg-white shadow-apple-xs [-webkit-overflow-scrolling:touch]">
                <table className="w-full text-sm table-auto min-w-[760px]">
                  <thead>
                    <tr className="border-b border-apple-mist">
                      {["Worker", "Role", "Site", "Date", "Hours"].map((h) => (
                        <th
                          key={h}
                          className={`px-4 py-3.5 text-2xs font-semibold uppercase tracking-widest text-apple-steel ${
                            h === "Hours" ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.payrollPreviewLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-6 text-center text-sm text-apple-smoke"
                        >
                          No attendance logs match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      payroll.payrollPreviewLogs.map((record, index) => (
                        <tr
                          key={`${record.role}-${record.name}-${record.date}-${record.site}-${index}`}
                          className="border-b border-apple-mist/60 last:border-0 odd:bg-apple-snow/40 hover:bg-apple-snow/70 transition"
                        >
                          <td className="px-4 py-3 text-sm font-semibold text-apple-charcoal">
                            {record.name}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-apple-charcoal">
                            {record.role}
                          </td>
                          <td className="px-4 py-3 text-xs text-apple-smoke">
                            {record.site}
                          </td>
                          <td className="px-4 py-3 text-xs text-apple-smoke">
                            {record.date}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-mono text-apple-ash">
                            {formatPayrollNumber(record.hours)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm  text-apple-steel">
                Showing{" "}
                {payrollActiveRowsCount === 0
                  ? 0
                  : payrollPreviewStart + 1}
                -
                {Math.min(
                  payrollPreviewEnd,
                  payrollActiveRowsCount,
                )}{" "}
                of {payrollActiveRowsCount}{" "}
                {payroll.payrollTab === "payroll"
                  ? "employee rows"
                  : "attendance log rows"}
                .
              </p>

              {payrollActiveRowsCount > PAYROLL_PREVIEW_LIMIT && (
                <div className="flex items-center gap-1 flex-wrap">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => payroll.setPayrollPage(1)}
                    disabled={payrollPage === 1}
                    className={`px-2.5 h-8 rounded-xl text-xs font-semibold border
${
  payrollPage === 1
    ? "border-apple-mist text-apple-silver cursor-not-allowed"
    : "border-apple-silver text-apple-charcoal hover:border-apple-charcoal"
}`}
                  >
                    First
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() =>
                      payroll.setPayrollPage((p) => Math.max(1, p - 1))
                    }
                    disabled={payrollPage === 1}
                    className={`px-3 h-8 rounded-xl text-xs font-semibold border
${
  payrollPage === 1
    ? "border-apple-mist text-apple-silver cursor-not-allowed"
    : "border-apple-silver text-apple-charcoal hover:border-apple-charcoal"
}`}
                  >
                    <ArrowLeft size={16} />
                  </motion.button>

                  {payrollPages.map((p) => (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.05 }}
                      key={p}
                      onClick={() => payroll.setPayrollPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold border transition
${
  payrollPage === p
    ? "bg-apple-charcoal text-white border-apple-charcoal"
    : "border-apple-silver text-apple-charcoal hover:border-apple-charcoal"
}`}
                    >
                      {p}
                    </motion.button>
                  ))}

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() =>
                      payroll.setPayrollPage((p) =>
                        Math.min(payrollTotalPages, p + 1),
                      )
                    }
                    disabled={payrollPage === payrollTotalPages}
                    className={`px-3 h-8 rounded-xl text-xs font-semibold border
${
  payrollPage === payrollTotalPages
    ? "border-apple-mist text-apple-silver cursor-not-allowed"
    : "border-apple-silver text-apple-charcoal hover:border-apple-charcoal"
}`}
                  >
                    <ArrowRight size={16} />
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() =>
                      payroll.setPayrollPage(payrollTotalPages)
                    }
                    disabled={payrollPage === payrollTotalPages}
                    className={`px-2.5 h-8 rounded-xl text-xs font-semibold border
${
  payrollPage === payrollTotalPages
    ? "border-apple-mist text-apple-silver cursor-not-allowed"
    : "border-apple-silver text-apple-charcoal hover:border-apple-charcoal"
}`}
                  >
                    Last
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


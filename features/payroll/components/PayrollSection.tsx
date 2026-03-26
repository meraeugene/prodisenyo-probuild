"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Calculator,
  FileSpreadsheet,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { highlight } from "@/components/Highlight";
import type { PayrollRow } from "@/lib/payrollEngine";
import {
  ROLE_CODE_TO_NAME,
  normalizeRoleCode,
  type RoleCode,
} from "@/lib/payrollConfig";
import {
  exportAllPayslipsToPdf,
  exportEmployeePayslipToPdf,
  type PayslipExportRecord,
} from "@/lib/payslipExport";
import type { Step2Sort } from "@/types";
import type { UsePayrollStateResult } from "@/features/payroll/hooks/usePayrollState";
import PaidHolidayModal from "@/features/payroll/components/PaidHolidayModal";
import { buildVisiblePages } from "@/features/shared/pagination";
import {
  computeDaysWorked,
  FIXED_PAY_RATE_PER_DAY,
} from "@/features/payroll/utils/payrollSelectors";
import {
  extractPayrollPeriod,
  extractSiteName,
  formatCompactPayrollPeriodLabel,
  formatPayrollNumber,
} from "@/features/payroll/utils/payrollFormatters";

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
  role: string;
  sites: PayrollRow[];
  totalHours: number;
  totalPay: number;
}

function normalizeEmployeeName(name: string): string {
  const normalized = name.trim().toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]/g, "");
  return EMPLOYEE_NAME_OVERRIDES[compact] ?? compact;
}

function pickPreferredRole(currentRole: string, candidateRole: string): string {
  const normalizedCurrent = normalizeRoleCode(currentRole) ?? "UNKNOWN";
  const normalizedCandidate = normalizeRoleCode(candidateRole) ?? "UNKNOWN";

  if (normalizedCurrent === "UNKNOWN" && normalizedCandidate !== "UNKNOWN") {
    return normalizedCandidate;
  }

  return normalizedCurrent;
}

function pickRepresentativeRow(rows: PayrollRow[]): PayrollRow | null {
  if (rows.length === 0) return null;

  const preferred = rows.find((row) => {
    const role = normalizeRoleCode(row.role) ?? "UNKNOWN";
    return role !== "UNKNOWN";
  });

  return preferred ?? rows[0] ?? null;
}

function formatDaysLabel(daysWorked: number): string {
  return `${daysWorked.toLocaleString("en-PH")} day${
    daysWorked === 1 ? "" : "s"
  }`;
}

function compareGroupedEmployees(
  a: GroupedEmployeePayrollRow,
  b: GroupedEmployeePayrollRow,
  sort: Step2Sort,
): number {
  if (sort === "name-desc") {
    return b.name.localeCompare(a.name);
  }

  return a.name.localeCompare(b.name);
}

function groupByEmployee(
  rows: PayrollRow[],
  sort: Step2Sort,
): GroupedEmployeePayrollRow[] {
  const grouped = new Map<string, GroupedEmployeePayrollRow>();

  for (const row of rows) {
    const key = normalizeEmployeeName(row.worker);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        name: row.worker,
        role: normalizeRoleCode(row.role) ?? "UNKNOWN",
        sites: [row],
        totalHours: row.hoursWorked,
        totalPay: row.totalPay,
      });
      continue;
    }

    existing.sites.push(row);
    existing.totalHours += row.hoursWorked;
    existing.totalPay += row.totalPay;
    existing.role = pickPreferredRole(existing.role, row.role);

    if (row.worker.length > existing.name.length) {
      existing.name = row.worker;
    }
  }

  return Array.from(grouped.values()).sort((a, b) =>
    compareGroupedEmployees(a, b, sort),
  );
}

function summarizeGroupedSites(rows: PayrollRow[]): Array<{ site: string }> {
  const summary = new Map<string, { site: string }>();

  for (const row of rows) {
    const normalizedSites = (row.site || "Unknown Site")
      .split(",")
      .map((site) => extractSiteName(site))
      .filter((site) => site.length > 0);

    for (const site of normalizedSites) {
      if (!summary.has(site)) {
        summary.set(site, { site });
      }
    }
  }

  return Array.from(summary.values()).sort((a, b) =>
    a.site.localeCompare(b.site),
  );
}

function buildPayslipRecord(
  employee: GroupedEmployeePayrollRow,
  periodLabel: string | null,
): PayslipExportRecord | null {
  const representativeRow = pickRepresentativeRow(employee.sites);
  if (!representativeRow) return null;

  const site = summarizeGroupedSites(employee.sites)
    .map((entry) => entry.site)
    .join(", ");

  return {
    employee: employee.name,
    role: employee.role,
    site: site || "-",
    period: periodLabel ?? representativeRow.date ?? "-",
    daysWorked: computeDaysWorked(employee.totalHours),
    totalHours: employee.totalHours,
    ratePerDay: FIXED_PAY_RATE_PER_DAY,
    totalPay: employee.totalPay,
  };
}

export default function PayrollSection({
  dailyRowsCount,
  availableSites,
  payroll,
  onGeneratePayroll,
}: PayrollSectionProps) {
  const [showPaidHolidayModal, setShowPaidHolidayModal] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  const groupedPayrollRows = useMemo(
    () => groupByEmployee(payroll.filteredPayrollRows, payroll.payrollSort),
    [payroll.filteredPayrollRows, payroll.payrollSort],
  );

  const groupedPayrollTotalPages = useMemo(
    () =>
      Math.max(1, Math.ceil(groupedPayrollRows.length / PAYROLL_PREVIEW_LIMIT)),
    [groupedPayrollRows.length],
  );

  const groupedPayrollPage = Math.min(
    payroll.payrollPage,
    groupedPayrollTotalPages,
  );
  const groupedPayrollPreviewStart =
    (groupedPayrollPage - 1) * PAYROLL_PREVIEW_LIMIT;
  const groupedPayrollPreviewEnd =
    groupedPayrollPreviewStart + PAYROLL_PREVIEW_LIMIT;

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

  const payrollPeriodLabel = useMemo(() => {
    const periodCounts = new Map<string, number>();

    for (const row of payroll.filteredPayrollRows) {
      const rowSites = (row.site || "Unknown Site")
        .split(",")
        .map((site) => site.trim())
        .filter((site) => site.length > 0);

      for (const site of rowSites) {
        const parsed = extractPayrollPeriod(site);
        if (!parsed) continue;
        const key = `${parsed.start}-${parsed.end}`;
        periodCounts.set(key, (periodCounts.get(key) ?? 0) + 1);
      }

      if (periodCounts.size > 0) continue;

      const fromDate = extractPayrollPeriod(row.date);
      if (!fromDate) continue;
      const key = `${fromDate.start}-${fromDate.end}`;
      periodCounts.set(key, (periodCounts.get(key) ?? 0) + 1);
    }

    if (periodCounts.size === 0) return null;

    const mostCommon = Array.from(periodCounts.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0];

    if (!mostCommon) return null;
    const [start, end] = mostCommon[0].split("-");
    return formatCompactPayrollPeriodLabel(start, end);
  }, [payroll.filteredPayrollRows]);

  const groupedPayrollTotals = useMemo(
    () =>
      groupedPayrollRows.reduce(
        (acc, row) => {
          acc.pay += row.totalPay;
          return acc;
        },
        { pay: 0 },
      ),
    [groupedPayrollRows],
  );

  const groupedPayslipRecords = useMemo(
    () =>
      groupedPayrollRows
        .map((employee) => buildPayslipRecord(employee, payrollPeriodLabel))
        .filter((record): record is PayslipExportRecord => Boolean(record)),
    [groupedPayrollRows, payrollPeriodLabel],
  );

  function handleExportAllPayslips() {
    if (groupedPayslipRecords.length === 0) return;
    void exportAllPayslipsToPdf(groupedPayslipRecords);
  }

  useEffect(() => {
    if (payroll.payrollTab !== "payroll") return;
    if (payroll.payrollPage <= groupedPayrollTotalPages) return;
    payroll.setPayrollPage(groupedPayrollTotalPages);
  }, [payroll, groupedPayrollTotalPages]);

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
    payroll.payrollTab === "payroll"
      ? groupedPayrollPages
      : payroll.payrollPages;

  if (dailyRowsCount === 0) return null;

  return (
    <section
      className="animate-fade-up"
      style={{ animationFillMode: "both", animationDelay: "80ms" }}
    >
      <div className="overflow-hidden rounded-[14px] border border-apple-mist bg-white shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
        <div className="flex flex-col gap-4 border-b border-apple-mist px-4 pb-4 pt-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pb-5 sm:pt-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xs font-mono font-semibold text-apple-steel uppercase tracking-widest">
                Step 3
              </span>
              {payroll.payrollGenerated && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-2xs font-semibold text-emerald-700">
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
              className="flex items-center gap-2 rounded-[10px] bg-[#1f6a37] hover:bg-[#18552d] px-5 py-3 text-sm font-semibold text-white transition  disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Calculator size={18} />
              Generate Payroll
            </button>
          )}
        </div>

        {payroll.payrollGenerated && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="space-y-5 px-4 py-5 sm:px-6 sm:py-6"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => payroll.setPayrollTab("payroll")}
                className={`rounded-[10px] border px-3 py-1.5 text-xs font-semibold transition-all duration-150
                  ${
                    payroll.payrollTab === "payroll"
                      ? "border-[#1f6a37] bg-[#1f6a37] text-white"
                      : "border-apple-mist bg-white text-apple-ash hover:border-[#7ebd8b]"
                  }`}
              >
                Payroll Summary
              </button>
              <button
                onClick={() => payroll.setPayrollTab("logs")}
                className={`rounded-[10px] border px-3 py-1.5 text-xs font-semibold transition-all duration-150
                  ${
                    payroll.payrollTab === "logs"
                      ? "border-[#1f6a37] bg-[#1f6a37] text-white"
                      : "border-apple-mist bg-white text-apple-ash hover:border-[#7ebd8b]"
                  }`}
              >
                Attendance Logs
              </button>

              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={payroll.handleExportPayroll}
                  disabled={payroll.filteredPayrollRows.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-apple-mist px-3.5 py-2 text-xs font-semibold text-apple-ash transition hover:border-apple-steel disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileSpreadsheet size={14} />
                  Export Excel
                </button>
                <button
                  type="button"
                  onClick={handleExportAllPayslips}
                  disabled={groupedPayslipRecords.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-apple-mist px-3.5 py-2 text-xs font-semibold text-apple-ash transition hover:border-apple-steel disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileSpreadsheet size={14} />
                  Export Payslips PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaidHolidayModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-apple-mist px-3.5 py-2 text-xs font-semibold text-apple-ash transition hover:border-apple-steel"
                >
                  <CalendarDays size={14} />
                  Paid Holidays
                </button>
                <button
                  type="button"
                  onClick={payroll.openPayrollRateModal}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-apple-mist px-3.5 py-2 text-xs font-semibold text-apple-ash transition hover:border-apple-steel"
                >
                  <SlidersHorizontal size={14} />
                  Edit Rates
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <select
                value={payroll.payrollSiteFilter}
                onChange={(e) => payroll.setPayrollSiteFilter(e.target.value)}
                className="h-11 cursor-pointer w-full rounded-[12px] border border-[#d9e2e6] bg-white px-3 text-sm text-[#334951] transition-all hover:border-[#0f6f74]/35 focus:border-[#0f6f74] focus:outline-none focus:ring-2 focus:ring-[#0f6f74]/10"
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
                className="h-11 w-full rounded-[12px] border border-[#d9e2e6] bg-white px-3 text-sm text-[#334951] cursor-pointer hover:border-[#0f6f74]/35 focus:border-[#0f6f74] focus:outline-none focus:ring-2 focus:ring-[#0f6f74]/10"
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
                  className="h-11 w-full rounded-[12px] border border-[#d9e2e6] pl-9 pr-9 text-sm text-[#334951] placeholder:text-[#9babaf] transition-all hover:border-[#0f6f74]/35 focus:border-[#0f6f74] focus:outline-none focus:ring-2 focus:ring-[#0f6f74]/10"
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

              <select
                value={payroll.payrollSort}
                onChange={(e) =>
                  payroll.setPayrollSort(e.target.value as Step2Sort)
                }
                className="h-11 w-full rounded-[12px] border border-[#d9e2e6] cursor-pointer bg-white px-3 text-sm text-[#334951] transition-all hover:border-[#0f6f74]/35 focus:border-[#0f6f74] focus:outline-none focus:ring-2 focus:ring-[#0f6f74]/10"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>

              <button
                type="button"
                onClick={payroll.clearPayrollFilters}
                className="h-11 w-full rounded-[12px] border border-[#d9e2e6] text-sm font-semibold text-[#41565f] transition-all hover:border-[#0f6f74]/35"
              >
                Clear Filters
              </button>
            </div>

            {payroll.payrollTab === "payroll" ? (
              <>
                <div className="flex gap-2">
                  {payrollPeriodLabel && (
                    <div className="inline-flex items-center rounded-[10px] border border-[#d9e2e6] bg-[#f9fbfc] px-3 py-1.5 text-sm font-semibold text-[#22353b]">
                      Payroll Period: {payrollPeriodLabel}
                    </div>
                  )}
                  <div className="inline-flex items-center rounded-[10px] border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-800">
                    Paid Holidays: {payroll.payableHolidayDays} day
                    {payroll.payableHolidayDays === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="overflow-x-auto rounded-[14px] border border-[#e7ecef] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)] [-webkit-overflow-scrolling:touch]">
                  <table className="w-full text-sm table-auto min-w-[1020px]">
                    <thead>
                      <tr className="border-b border-[#edf1f3] bg-[#fafbfc]">
                        {[
                          "Employee",
                          "Role",
                          "Site",
                          "Days Worked",
                          "Rate/Day",
                          "Total Pay",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className={`px-4 py-3.5 text-2xs font-semibold uppercase tracking-widest text-[#9babaf] ${
                              h === "Days Worked" ||
                              h === "Rate/Day" ||
                              h === "Total Pay"
                                ? "text-right"
                                : h === "Actions"
                                  ? "text-center"
                                  : "text-left"
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groupedPayrollPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10">
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
                          const representativeRow = pickRepresentativeRow(
                            employee.sites,
                          );
                          const siteBreakdown = summarizeGroupedSites(
                            employee.sites,
                          );
                          const employeeDaysWorked = computeDaysWorked(
                            employee.totalHours,
                          );
                          const employeeTotalPay = employee.totalPay;
                          const employeeDailyRate = FIXED_PAY_RATE_PER_DAY;
                          const employeePayslipRecord = buildPayslipRecord(
                            employee,
                            payrollPeriodLabel,
                          );

                          return (
                            <tr
                              key={representativeRow?.id ?? employee.name}
                              className="border-b border-[#edf1f3] last:border-0 odd:bg-[#fbfcfd] transition hover:bg-[#f5f9fa]"
                            >
                              <td className="px-4 py-3 text-sm font-semibold text-apple-charcoal">
                                {highlight(
                                  employee.name,
                                  payroll.payrollNameFilter,
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs font-semibold text-apple-charcoal">
                                {employee.role}
                              </td>

                              <td className="px-4 py-3">
                                <p className="text-sm font-semibold text-apple-charcoal">
                                  {siteBreakdown
                                    .map((siteRow) => siteRow.site)
                                    .join(", ")}
                                </p>
                              </td>

                              <td className="px-4 py-3 text-sm font-mono text-apple-charcoal text-right">
                                {formatDaysLabel(employeeDaysWorked)}
                              </td>
                              <td className="px-4 py-3 text-sm font-mono text-apple-ash text-right">
                                {formatPayrollNumber(employeeDailyRate)}
                              </td>
                              <td className="px-4 py-3 text-sm font-mono text-apple-charcoal font-semibold text-right">
                                {formatPayrollNumber(employeeTotalPay)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div
                                  className="relative flex items-center justify-center"
                                  ref={
                                    openActionMenuId ===
                                    (representativeRow?.id ?? employee.name)
                                      ? actionMenuRef
                                      : null
                                  }
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenActionMenuId((current) =>
                                        current ===
                                        (representativeRow?.id ?? employee.name)
                                          ? null
                                          : (representativeRow?.id ??
                                            employee.name),
                                      )
                                    }
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] border transition-all duration-200 border-[#d9e2e6] text-[#41565f] ${
                                      openActionMenuId ===
                                      (representativeRow?.id ?? employee.name)
                                        ? "bg-[#f3f6f8]"
                                        : "hover:border-[#0f6f74]/35 hover:bg-[#f7faf9]"
                                    }`}
                                    aria-label={`Open actions for ${employee.name}`}
                                    aria-expanded={
                                      openActionMenuId ===
                                      (representativeRow?.id ?? employee.name)
                                    }
                                    aria-haspopup="menu"
                                  >
                                    <MoreHorizontal size={16} />
                                  </button>

                                  {openActionMenuId ===
                                    (representativeRow?.id ??
                                      employee.name) && (
                                    <div
                                      className="animate-fade-in absolute left-1/2 top-[calc(100%+0.5rem)] z-20 min-w-max -translate-x-1/2 overflow-hidden rounded-[14px] border border-[#d9e2e6] bg-white p-1.5 text-left shadow-[0_16px_36px_rgba(15,23,42,0.12)]"
                                      role="menu"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!representativeRow) return;
                                          payroll.openPayrollEditModal(
                                            representativeRow,
                                          );
                                          setOpenActionMenuId(null);
                                        }}
                                        disabled={!representativeRow}
                                        className="flex w-full items-center whitespace-nowrap rounded-[10px] px-3 py-2 text-[11px] font-semibold text-[#41565f] transition hover:bg-[#f5f9fa] disabled:cursor-not-allowed disabled:opacity-50"
                                        role="menuitem"
                                      >
                                        Edit Employee
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!employeePayslipRecord) return;
                                          void exportEmployeePayslipToPdf(
                                            employeePayslipRecord,
                                          );
                                          setOpenActionMenuId(null);
                                        }}
                                        disabled={!employeePayslipRecord}
                                        className="flex w-full items-center whitespace-nowrap rounded-[10px] px-3 py-2 text-[11px] font-semibold text-[#41565f] transition hover:bg-[#f5f9fa] disabled:cursor-not-allowed disabled:opacity-50"
                                        role="menuitem"
                                      >
                                        Export Payslip
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-apple-silver bg-[#1f6a37]">
                        <td className="px-4 py-3 text-sm font-semibold text-white">
                          Summary
                        </td>
                        <td className="px-4 py-3" />
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
              </>
            ) : (
              <div className="overflow-x-auto rounded-[14px] border border-[#e7ecef] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)] [-webkit-overflow-scrolling:touch]">
                <table className="w-full text-sm table-auto min-w-[760px]">
                  <thead>
                    <tr className="border-b border-[#edf1f3] bg-[#fafbfc]">
                      {["Worker", "Role", "Site", "Date", "Hours"].map((h) => (
                        <th
                          key={h}
                          className={`px-4 py-3.5 text-2xs font-semibold uppercase tracking-widest text-[#9babaf] ${
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
                          className="border-b border-[#edf1f3] last:border-0 odd:bg-[#fbfcfd] transition hover:bg-[#f5f9fa]"
                        >
                          <td className="px-4 py-3 text-sm font-semibold text-apple-charcoal">
                            {record.name}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-apple-charcoal">
                            {record.role}
                          </td>
                          <td className="px-4 py-3 text-xs text-apple-smoke">
                            {extractSiteName(record.site)}
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
                {payrollActiveRowsCount === 0 ? 0 : payrollPreviewStart + 1}-
                {Math.min(payrollPreviewEnd, payrollActiveRowsCount)} of{" "}
                {payrollActiveRowsCount}{" "}
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
                    className={`h-8 rounded-[10px] border px-2.5 text-xs font-semibold
${
  payrollPage === 1
    ? "border-apple-mist text-apple-silver cursor-not-allowed"
    : "border-apple-silver text-apple-charcoal hover:border-[#7ebd8b]"
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
                    className={`h-8 rounded-[10px] border px-3 text-xs font-semibold
${
  payrollPage === 1
    ? "border-apple-mist text-apple-silver cursor-not-allowed"
    : "border-apple-silver text-apple-charcoal hover:border-[#7ebd8b]"
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
                      className={`h-8 w-8 rounded-[10px] border text-xs font-semibold transition
${
  payrollPage === p
    ? "bg-[#1f6a37] text-white border-[#1f6a37]"
    : "border-apple-silver text-apple-charcoal hover:border-[#7ebd8b]"
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
                    className={`h-8 rounded-[10px] border px-3 text-xs font-semibold
${
  payrollPage === payrollTotalPages
    ? "border-apple-mist text-apple-silver cursor-not-allowed"
    : "border-apple-silver text-apple-charcoal hover:border-[#7ebd8b]"
}`}
                  >
                    <ArrowRight size={16} />
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => payroll.setPayrollPage(payrollTotalPages)}
                    disabled={payrollPage === payrollTotalPages}
                    className={`h-8 rounded-[10px] border px-2.5 text-xs font-semibold
${
  payrollPage === payrollTotalPages
    ? "border-apple-mist text-apple-silver cursor-not-allowed"
    : "border-apple-silver text-apple-charcoal hover:border-[#7ebd8b]"
}`}
                  >
                    Last
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <PaidHolidayModal
        show={showPaidHolidayModal}
        holidays={payroll.paidHolidays}
        periodStart={payroll.payrollDateRange?.start ?? null}
        periodEnd={payroll.payrollDateRange?.end ?? null}
        onClose={() => setShowPaidHolidayModal(false)}
        onAddManualHoliday={payroll.addManualPaidHoliday}
        onRemoveHoliday={payroll.removePaidHoliday}
        onLoadPhilippineHolidays={payroll.loadPhilippinePaidHolidays}
        onClearHolidays={payroll.clearPaidHolidays}
      />
    </section>
  );
}

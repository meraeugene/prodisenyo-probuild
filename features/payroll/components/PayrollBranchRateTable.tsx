"use client";

import type { UsePayrollStateResult } from "@/features/payroll/hooks/usePayrollState";
import { normalizeEmployeeBranchRateConfig } from "@/features/payroll/utils/branchRateConfig";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";

interface BranchRateRow {
  worker: string;
  role: string;
  siteLabel: string;
  key: string;
  fallbackRate: number;
  fallbackRegularPaidHours: number;
}

export default function PayrollBranchRateTable({ rows, payroll, branchCountByEmployee }: {
  rows: BranchRateRow[];
  payroll: UsePayrollStateResult;
  branchCountByEmployee: Map<string, number>;
}) {
  return (
        <div className="mt-4 min-h-0 overflow-auto overscroll-contain rounded-xl border border-slate-200">
          <table className="min-w-[760px] text-sm sm:min-w-full">
            <thead className="sticky top-0 z-10 bg-apple-snow/95 backdrop-blur-sm">
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-apple-steel">
                  Employee
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-apple-steel">
                  Role
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-apple-steel">
                  Branch
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-apple-steel">
                  Daily Rate
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-apple-steel">
                  Regular Paid Hours
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-apple-steel">
                  OT Multiplier
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => {
                  const draftConfig = normalizeEmployeeBranchRateConfig(
                    payroll.payrollRateDraft[row.key],
                    row.fallbackRate,
                  );

                  return (
                    <tr
                      key={row.key}
                      className="border-b border-slate-200/70 last:border-0"
                    >
                    <td className="px-3 py-2 font-medium text-apple-charcoal">
                      <div className="flex items-center gap-2">
                        <span>{row.worker}</span>
                        {(branchCountByEmployee.get(
                          row.worker.trim().toLowerCase(),
                        ) ?? 0) > 1 ? (
                          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700">
                            Multi-branch
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-apple-ash">{row.role}</td>
                    <td className="px-3 py-2 text-apple-ash">
                      {row.siteLabel}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Daily rate for ${row.worker} at ${row.siteLabel}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={draftConfig.dailyRate}
                        onChange={(event) => {
                          const parsed = Number.parseFloat(event.target.value);
                          payroll.setPayrollRateDraft((prev) => ({
                            ...prev,
                            [row.key]: {
                              ...normalizeEmployeeBranchRateConfig(
                                prev[row.key],
                                row.fallbackRate,
                              ),
                              dailyRate:
                                Number.isFinite(parsed) && parsed >= 0
                                  ? parsed
                                  : 0,
                            },
                          }));
                        }}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-right text-sm text-apple-charcoal transition-all focus:border-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15"
                      />
                      <p className="mt-1 text-right text-[11px] text-apple-steel">
                        Hourly:{" "}
                        {formatPayrollNumber(draftConfig.dailyRate / 8)}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Regular paid hours for ${row.worker} at ${row.siteLabel}`}
                        type="number"
                        min={0.01}
                        step="0.25"
                        value={draftConfig.regularPaidHours}
                        onChange={(event) => {
                          const parsed = Number.parseFloat(event.target.value);
                          payroll.setPayrollRateDraft((prev) => ({
                            ...prev,
                            [row.key]: {
                              ...normalizeEmployeeBranchRateConfig(
                                prev[row.key],
                                row.fallbackRate,
                              ),
                              regularPaidHours:
                                Number.isFinite(parsed) && parsed > 0
                                  ? parsed
                                  : row.fallbackRegularPaidHours,
                            },
                          }));
                        }}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-right text-sm text-apple-charcoal transition-all focus:border-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15"
                      />
                      <p className="mt-1 text-right text-[11px] text-apple-steel">
                        Max regular hours paid
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`OT multiplier for ${row.worker} at ${row.siteLabel}`}
                        type="number"
                        min={0.01}
                        max={5}
                        step="0.01"
                        value={draftConfig.overtimeMultiplier}
                        onChange={(event) => {
                          const parsed = Number.parseFloat(event.target.value);
                          payroll.setPayrollRateDraft((prev) => ({
                            ...prev,
                            [row.key]: {
                              ...normalizeEmployeeBranchRateConfig(
                                prev[row.key],
                                row.fallbackRate,
                              ),
                              overtimeMultiplier:
                                Number.isFinite(parsed) && parsed > 0
                                  ? Math.min(parsed, 5)
                                  : draftConfig.overtimeMultiplier,
                            },
                          }));
                        }}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-right text-sm text-apple-charcoal transition-all focus:border-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15"
                      />
                      <p className="mt-1 text-right text-[11px] text-apple-steel">
                        1.00 = straight-time OT
                      </p>
                    </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-apple-steel"
                  >
                    No employee branch rates matched your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
  );
}

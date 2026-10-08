"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { highlight } from "@/components/Highlight";
import type { UsePayrollStateResult } from "@/features/payroll/hooks/usePayrollState";
import {
  buildGroupedEmployeeMetrics,
  summarizeGroupedSites,
  type GroupedEmployeePayrollRow,
} from "@/features/payroll/utils/payrollSectionHelpers";
import { FIXED_PAY_RATE_PER_DAY } from "@/features/payroll/utils/payrollSelectors";
import {
  employeeNeedsPayrollReview,
  formatPeso,
  getEmployeeInitials,
} from "@/features/payroll/utils/payrollWorkspace";
import PayrollEmployeeActionMenu from "./PayrollEmployeeActionMenu";
import PayrollEmployeeCard from "./PayrollEmployeeCard";

interface PayrollEmployeesTableProps {
  employees: GroupedEmployeePayrollRow[];
  payroll: UsePayrollStateResult;
  periodLabel: string;
  search: string;
  workdayTarget: number;
}

export default function PayrollEmployeesTable({
  employees,
  payroll,
  periodLabel,
  search,
  workdayTarget,
}: PayrollEmployeesTableProps) {
  const [actionEmployee, setActionEmployee] = useState<GroupedEmployeePayrollRow | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!actionEmployee) return;
    const close = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setActionEmployee(null);
      setMenuPosition(null);
    };
    const closeOnViewport = () => {
      setActionEmployee(null);
      setMenuPosition(null);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", closeOnViewport, true);
    window.addEventListener("resize", closeOnViewport);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", closeOnViewport, true);
      window.removeEventListener("resize", closeOnViewport);
    };
  }, [actionEmployee]);

  function openActions(employee: GroupedEmployeePayrollRow, button: HTMLButtonElement) {
    const rect = button.getBoundingClientRect();
    setActionEmployee(employee);
    setMenuPosition({
      top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 104)),
      left: Math.min(window.innerWidth - 8, Math.max(178, rect.right)),
    });
  }

  if (employees.length === 0) {
    return (
      <div className="grid h-56 place-items-center rounded-[10px] border border-[#dce6ea] bg-white text-center">
        <div>
          <p className="mt-3 text-sm font-semibold text-[#20354d]">No employees found</p>
          <p className="mt-1 text-xs text-[#7b8da0]">Try changing or clearing the active filters.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:hidden">
        {employees.map((employee) => (
          <PayrollEmployeeCard
            key={employee.employeeId ?? employee.name}
            employee={employee}
            payroll={payroll}
            workdayTarget={workdayTarget}
            onOpenActions={(event) => openActions(employee, event.currentTarget)}
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[10px] border border-[#dce6ea] bg-white xl:block">
        <table className="w-full table-fixed text-left">
          <thead className="bg-[#f6f9fa]">
            <tr className="border-b border-[#dfe8ec]">
              <HeaderCell className="w-[23%]">Employee</HeaderCell>
              <HeaderCell className="w-[18%]">Attendance</HeaderCell>
              <HeaderCell>Sites</HeaderCell>
              <HeaderCell>Hours</HeaderCell>
              <HeaderCell>Rate/Hour</HeaderCell>
              <HeaderCell>Pay</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <th className="w-16 px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[0.06em] text-[#697c91]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => {
              const metrics = buildGroupedEmployeeMetrics(employee, payroll);
              const sites = summarizeGroupedSites(employee.sites).map((entry) => entry.site);
              const needsReview = employeeNeedsPayrollReview(employee);
              const days = Math.min(workdayTarget, Math.max(0, Math.round(metrics.daysWorked)));
              const progress = Math.min(100, (days / workdayTarget) * 100);
              const hourlyRate = (metrics.dailyRates[0] ?? FIXED_PAY_RATE_PER_DAY) / 8;
              return (
                <tr key={employee.employeeId ?? employee.name} className="border-b border-[#e4ebee] last:border-0 transition hover:bg-[#f8fbfb]">
                  <td className="px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dcebf2] text-[11px] font-bold text-[#17547a]">{getEmployeeInitials(employee.name)}</span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#132842]">{highlight(employee.name, search)}</p>
                        <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.03em] text-[#718499]">{employee.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-xs font-medium text-[#263b51]">{days} / {workdayTarget} days</p>
                    <div className="mt-2 h-1.5 w-full max-w-[130px] overflow-hidden rounded-full bg-[#dfe8eb]">
                      <div className={needsReview ? "h-full rounded-full bg-[#f5a21b]" : "h-full rounded-full bg-[#20ae72]"} style={{ width: progress + "%" }} />
                    </div>
                  </td>
                  <td className="truncate px-3 py-2.5 text-xs font-medium text-[#30465c]">{sites.length > 1 ? sites.length + " sites" : sites[0] ?? "—"}</td>
                  <td className="truncate px-3 py-2.5 text-xs font-medium tabular-nums text-[#30465c]">{metrics.actualTotalHours.toFixed(2)}</td>
                  <td className="truncate px-3 py-2.5 text-xs font-medium tabular-nums text-[#30465c]">{formatPeso(hourlyRate)}</td>
                  <td className="truncate px-3 py-2.5 text-xs font-semibold tabular-nums text-[#122a45]">{formatPeso(metrics.totalPay)}</td>
                  <td className="px-2 py-2.5">
                    <span className={needsReview ? "inline-flex items-center gap-1 rounded-full bg-[#fff0d9] px-2 py-1.5 text-[10px] font-semibold text-[#c96808]" : "inline-flex items-center gap-1 rounded-full bg-[#dff7ee] px-2 py-1.5 text-[10px] font-semibold text-[#078d64]"}>
                      {needsReview ? "Review" : "Ready"}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={(event) => openActions(employee, event.currentTarget)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#d3dfe5] text-[#3f576e] transition hover:border-[#82bcb7] hover:bg-[#f3f9f8]"
                      aria-label={"Open actions for " + employee.name}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PayrollEmployeeActionMenu
        employee={actionEmployee}
        position={menuPosition}
        periodLabel={periodLabel}
        payroll={payroll}
        menuRef={menuRef}
        onClose={() => {
          setActionEmployee(null);
          setMenuPosition(null);
        }}
      />
    </>
  );
}

function HeaderCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={"px-3 py-3 text-[10px] font-bold uppercase tracking-[0.06em] text-[#697c91] " + (className ?? "")}>
      <span className="inline-flex items-center gap-1">{children}</span>
    </th>
  );
}

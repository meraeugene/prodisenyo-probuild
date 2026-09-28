"use client";

import { createPortal } from "react-dom";
import { Download, Pencil } from "lucide-react";
import type { PayrollRow } from "@/lib/payrollEngine";
import { exportEmployeePayslipToPdf } from "@/lib/payslipExport";
import type { UsePayrollStateResult } from "@/features/payroll/hooks/usePayrollState";
import {
  buildGroupedEmployeeCompensation,
  buildGroupedEmployeeMetrics,
  buildPayslipRecord,
  pickRepresentativeRow,
  summarizeGroupedSites,
  type GroupedEmployeePayrollRow,
} from "@/features/payroll/utils/payrollSectionHelpers";

interface PayrollEmployeeActionMenuProps {
  employee: GroupedEmployeePayrollRow | null;
  position: { top: number; left: number } | null;
  periodLabel: string;
  payroll: UsePayrollStateResult;
  menuRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}

export default function PayrollEmployeeActionMenu({
  employee,
  position,
  periodLabel,
  payroll,
  menuRef,
  onClose,
}: PayrollEmployeeActionMenuProps) {
  if (!employee || !position || typeof document === "undefined") return null;

  function handleEdit() {
    if (!employee) return;
    const representativeRow = pickRepresentativeRow(employee.sites);
    if (!representativeRow) return;
    const compensation = buildGroupedEmployeeCompensation(employee, payroll);
    const metrics = buildGroupedEmployeeMetrics(employee, payroll);
    const sites = summarizeGroupedSites(employee.sites).map((entry) => entry.site);
    const displayRow: PayrollRow = {
      ...representativeRow,
      worker: employee.name,
      role: employee.role,
      site: sites.join(", "),
      sites,
      rawBiometricNames: Array.from(new Set(employee.sites.flatMap((entry) => entry.rawBiometricNames ?? []))),
      matchStatus: employee.sites.some((entry) => entry.matchStatus === "NEEDS_REVIEW")
        ? "NEEDS_REVIEW"
        : employee.sites.some((entry) => entry.matchStatus === "UNMATCHED")
          ? "UNMATCHED"
          : "MATCHED",
      hoursWorked: metrics.paidRegularHours,
      overtimeHours: employee.sites.reduce((sum, row) => sum + row.overtimeHours, 0),
      regularPay: compensation.totalBasePay,
      totalPay: metrics.totalPay,
    };
    payroll.openPayrollEditModal(representativeRow, displayRow);
    onClose();
  }

  function handleExport() {
    if (!employee) return;
    const record = buildPayslipRecord(employee, periodLabel, payroll);
    if (record) void exportEmployeePayslipToPdf(record);
    onClose();
  }

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{ top: position.top, left: position.left }}
      className="fixed z-[140] min-w-[170px] -translate-x-full overflow-hidden rounded-[10px] border border-[#d6e1e6] bg-white p-1.5 shadow-[0_16px_36px_rgba(15,23,42,0.14)]"
    >
      <MenuButton icon={Pencil} label="Edit employee" onClick={handleEdit} />
      <MenuButton icon={Download} label="Export payslip" onClick={handleExport} />
    </div>,
    document.body,
  );
}

function MenuButton({ icon: Icon, label, onClick }: { icon: typeof Pencil; label: string; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className="flex w-full items-center gap-2 rounded-[7px] px-3 py-2 text-left text-xs font-semibold text-[#354a61] transition hover:bg-[#eff8f6] hover:text-[#08766f]">
      <Icon size={14} />
      {label}
    </button>
  );
}

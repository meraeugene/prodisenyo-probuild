"use client";

import dynamic from "next/dynamic";
import { useAppState } from "@/features/app/AppStateProvider";
import type { AppRole } from "@/types/database";

const PayrollRateModal = dynamic(() => import("@/features/payroll/components/PayrollRateModal"), { ssr: false });
const PayrollEditModal = dynamic(() => import("@/features/payroll/components/PayrollEditModal"), { ssr: false });

export default function DashboardOverlays({ role }: { role: AppRole | null }) {
  const { payroll } = useAppState();
  if (role === "gmea") return null;

  return (
    <>
      {payroll.showPayrollRateModal && <PayrollRateModal payroll={payroll} />}
      {payroll.editingPayrollRow && payroll.payrollEditDraft && <PayrollEditModal payroll={payroll} currentUserRole={role} />}
    </>
  );
}

"use client";

import PayrollEditModal from "@/features/payroll/components/PayrollEditModal";
import PayrollRateModal from "@/features/payroll/components/PayrollRateModal";
import { useAppState } from "@/features/app/AppStateProvider";

export default function DashboardOverlays() {
  const { payroll } = useAppState();

  return (
    <>
      <PayrollRateModal payroll={payroll} />
      <PayrollEditModal payroll={payroll} />
    </>
  );
}

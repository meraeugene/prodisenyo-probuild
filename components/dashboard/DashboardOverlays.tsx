"use client";

import PayrollEditModal from "@/features/payroll/components/PayrollEditModal";
import PayrollRateModal from "@/features/payroll/components/PayrollRateModal";
import { useAppState } from "@/features/app/AppStateProvider";

export default function DashboardOverlays() {
  const { payroll } = useAppState();

  return (
    <>
      <PayrollRateModal
        show={payroll.showPayrollRateModal}
        roleCodes={payroll.roleCodes}
        payrollRateDraft={payroll.payrollRateDraft}
        setPayrollRateDraft={payroll.setPayrollRateDraft}
        onClose={payroll.closePayrollRateModal}
        onApply={payroll.applyPayrollRates}
      />
      <PayrollEditModal payroll={payroll} />
    </>
  );
}

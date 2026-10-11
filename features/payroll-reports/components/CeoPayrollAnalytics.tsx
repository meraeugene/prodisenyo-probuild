"use client";

import type { PayrollRunRow } from "../types";
import PayrollApprovalAnalytics from "./PayrollApprovalAnalytics";

export default function CeoPayrollAnalytics({ reports, active }: { reports: PayrollRunRow[]; active: boolean }) {
  return <section aria-label="Payroll analytics" hidden={!active} className="space-y-5">
    <header><h2 className="text-lg font-semibold">Payroll analytics</h2>
      <p className="mt-1 text-sm text-slate-500">Compare payroll trends, approval status, and spending by site.</p></header>
    <PayrollApprovalAnalytics reports={reports} active={active} />
  </section>;
}

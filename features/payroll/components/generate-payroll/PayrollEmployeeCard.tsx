import { MoreHorizontal } from "lucide-react";
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

interface PayrollEmployeeCardProps {
  employee: GroupedEmployeePayrollRow;
  payroll: UsePayrollStateResult;
  workdayTarget: number;
  onOpenActions: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function PayrollEmployeeCard({
  employee,
  payroll,
  workdayTarget,
  onOpenActions,
}: PayrollEmployeeCardProps) {
  const metrics = buildGroupedEmployeeMetrics(employee, payroll);
  const sites = summarizeGroupedSites(employee.sites).map((entry) => entry.site);
  const needsReview = employeeNeedsPayrollReview(employee);
  const days = Math.min(workdayTarget, Math.max(0, Math.round(metrics.daysWorked)));
  const progress = Math.min(100, (days / workdayTarget) * 100);
  const hourlyRate = (metrics.dailyRates[0] ?? FIXED_PAY_RATE_PER_DAY) / 8;

  return (
    <article className="rounded-[10px] border border-[#dce6ea] bg-white p-4 shadow-workspace">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dcebf2] text-xs font-bold text-[#17547a]">
          {getEmployeeInitials(employee.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#132842]">{employee.name}</p>
          <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.03em] text-[#718499]">
            {employee.role}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenActions}
          className="inline-flex h-8 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#d3dfe5] text-[#3f576e] transition hover:border-[#82bcb7] hover:bg-[#f3f9f8]"
          aria-label={"Open actions for " + employee.name}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#263b51]">Attendance</span>
          <span className="font-semibold text-[#132842]">{days} / {workdayTarget} days</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dfe8eb]">
          <div
            className={needsReview ? "h-full rounded-full bg-[#f5a21b]" : "h-full rounded-full bg-[#20ae72]"}
            style={{ width: progress + "%" }}
          />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-[#e5ecef] pt-4 text-xs">
        <CardDetail label="Sites" value={sites.length > 1 ? sites.length + " sites" : sites[0] ?? "—"} />
        <CardDetail label="Hours" value={metrics.actualTotalHours.toFixed(2)} />
        <CardDetail label="Rate/Hour" value={formatPeso(hourlyRate)} />
        <CardDetail label="Pay" value={formatPeso(metrics.totalPay)} strong />
      </dl>

      <div className="mt-4 flex justify-end">
        <span className={needsReview ? "inline-flex items-center gap-1.5 rounded-full bg-[#fff0d9] px-3 py-1.5 text-[11px] font-semibold text-[#c96808]" : "inline-flex items-center gap-1.5 rounded-full bg-[#dff7ee] px-3 py-1.5 text-[11px] font-semibold text-[#078d64]"}>
          {needsReview ? "Review" : "Ready"}
        </span>
      </div>
    </article>
  );
}

function CardDetail({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#7a8da0]">{label}</dt>
      <dd className={strong ? "mt-1 truncate font-bold tabular-nums text-[#122a45]" : "mt-1 truncate font-medium tabular-nums text-[#30465c]"}>{value}</dd>
    </div>
  );
}

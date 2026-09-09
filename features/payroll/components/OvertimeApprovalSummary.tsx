import {
  Banknote,
  ClipboardCheck,
  Clock3,
  FileClock,
} from "lucide-react";
import type { OvertimeRequestRecord } from "@/features/overtime-requests/types";
import type { PendingOvertimeRequest } from "@/features/payroll/utils/payrollApprovalQueueHelpers";

export default function OvertimeApprovalSummary({
  payrollRequests,
  staffRequests,
}: {
  payrollRequests: PendingOvertimeRequest[];
  staffRequests: OvertimeRequestRecord[];
}) {
  const pendingPayroll = payrollRequests.filter(
    (request) => request.status === "pending",
  );
  const pendingStaff = staffRequests.filter(
    (request) => request.status === "pending",
  );
  const hours = pendingStaff.reduce(
    (sum, request) => sum + Number(request.overtime_hours || 0),
    0,
  );
  const amount = [...pendingPayroll, ...pendingStaff].reduce(
    (sum, request) => sum + Number(request.amount || 0),
    0,
  );
  const cards = [
    {
      label: "Pending decisions",
      value: pendingPayroll.length + pendingStaff.length,
      helper: "Across both approval queues",
      icon: ClipboardCheck,
      tone: "bg-teal-50 text-teal-700",
    },
    {
      label: "Payroll overtime",
      value: pendingPayroll.length,
      helper: "Adjustments awaiting review",
      icon: FileClock,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Requested hours",
      value: hours.toLocaleString("en-PH", { maximumFractionDigits: 2 }),
      helper: "From pending staff forms",
      icon: Clock3,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Pending amount",
      value: `₱${amount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      helper: "Estimated approval value",
      icon: Banknote,
      tone: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <section
      aria-label="Overtime approval summary"
      className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4"
    >
      {cards.map(({ label, value, helper, icon: Icon, tone }) => (
        <article
          key={label}
          className="flex min-w-0 items-start gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_-25px_rgba(15,23,42,.25)]"
        >
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
            <Icon size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xs font-medium text-slate-500">{label}</h2>
            <p className="mt-1.5 break-words text-2xl font-bold tracking-tight text-slate-950 tabular-nums">
              {value}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">{helper}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

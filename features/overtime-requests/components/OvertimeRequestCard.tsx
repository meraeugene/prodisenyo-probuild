import { formatOvertimeRequesterRole, type OvertimeRequestRecord } from "../types";
import { formatOvertimeRequestDateTime, getOvertimeRequestStatusClasses, getOvertimeRequestStatusLabel } from "../utils/overtimeRequestPresentation";

export default function OvertimeRequestCard({ request }: { request: OvertimeRequestRecord }) {
  return (
    <article
      key={request.id}
      className="overflow-hidden rounded-2xl border border-apple-mist bg-white shadow-[0_6px_16px_rgba(15,23,42,0.07)]"
    >
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
              {formatOvertimeRequesterRole(request.requester_role)}
            </p>
            <h3 className="mt-1 text-lg font-bold text-apple-charcoal">
              {request.employee_name}
            </h3>
            <div className="mt-1 inline-flex items-center gap-1 text-sm text-apple-smoke">
              {request.site_name}
            </div>
          </div>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${getOvertimeRequestStatusClasses(request.status)}`}
          >
            {getOvertimeRequestStatusLabel(request.status)}
          </span>
        </div>

        <div className="grid gap-2 rounded-xl border border-apple-mist bg-white/75 p-3 text-sm text-apple-smoke">
          <p className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5">
              Work date
            </span>
            <span className="font-semibold text-apple-charcoal">
              {request.request_date}
            </span>
          </p>
          <p className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5">
              Overtime hours
            </span>
            <span className="font-semibold text-sky-700">
              {request.overtime_hours.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </p>
        </div>

        {request.period_label ? (
          <p className="text-sm text-apple-smoke">
            Period:{" "}
            <span className="font-semibold text-apple-charcoal">
              {request.period_label}
            </span>
          </p>
        ) : null}

        <p className="text-sm text-apple-smoke">
          Submitted:{" "}
          <span className="font-semibold text-apple-charcoal">
            {formatOvertimeRequestDateTime(request.created_at)}
          </span>
        </p>

        {request.rejection_reason ? (
          <p className="rounded-lg border border-[#ccfbf1] bg-[#f0fdfa] px-3 py-2 text-sm text-[#0f766e]">
            Return reason:{" "}
            <span className="font-semibold">
              {request.rejection_reason}
            </span>
          </p>
        ) : null}
      </div>
    </article>
  );
}

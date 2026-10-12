"use client";

import OvertimeRequestConfirmDialog from "./OvertimeRequestConfirmDialog";
import OvertimeRequestHistory from "./OvertimeRequestHistory";

import { useMemo, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import WorkspacePageHeader from "@/components/workspace/WorkspacePageHeader";
import styles from "@/components/workspace/workspace.module.css";
import { submitOvertimeRequestAction } from "@/actions/payroll";
import { type OvertimeRequestRecord } from "@/features/overtime-requests/types";

type OvertimeFormErrors = {
  employeeName?: string;
  siteName?: string;
  requestDate?: string;
  overtimeHours?: string;
  reason?: string;
};

function baseInputClass(hasError: boolean) {
  return `h-10 w-full rounded-xl border px-3 outline-none transition focus:border-teal-400 ${
    hasError
      ? "border-rose-400  ring-1 ring-rose-200"
      : "border-apple-mist bg-white"
  }`;
}

export default function OvertimeRequestPageClient({
  initialRequests,
  initialEmployeeName,
}: {
  initialRequests: OvertimeRequestRecord[];
  initialEmployeeName: string;
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [employeeName, setEmployeeName] = useState(initialEmployeeName);
  const [siteName, setSiteName] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");
  const [requestDate, setRequestDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [overtimeHours, setOvertimeHours] = useState("");
  const [reason, setReason] = useState("");
  const [formErrors, setFormErrors] = useState<OvertimeFormErrors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [requests],
  );

  function validateForm() {
    const errors: OvertimeFormErrors = {};
    const trimmedEmployeeName = employeeName.trim();
    const trimmedSiteName = siteName.trim();
    const trimmedOvertimeHours = overtimeHours.trim();
    const trimmedReason = reason.trim();

    if (!trimmedEmployeeName) {
      errors.employeeName = "Employee name is required.";
    }

    if (!trimmedSiteName) {
      errors.siteName = "Site name is required.";
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestDate)) {
      errors.requestDate = "Please select a valid request date.";
    }

    if (!trimmedOvertimeHours) {
      errors.overtimeHours = "Overtime hours is required.";
    }

    if (trimmedReason.length > 500) {
      errors.reason = "Reason must be 500 characters or less.";
    }

    return {
      errors,
      hasErrors: Object.keys(errors).length > 0,
    };
  }

  function submitRequest() {
    const validation = validateForm();
    if (validation.hasErrors) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    setConfirmOpen(false);

    startTransition(async () => {
      try {
        const result = await submitOvertimeRequestAction({
          employeeName: employeeName.trim(),
          siteName: siteName.trim(),
          periodLabel: periodLabel.trim(),
          requestDate,
          overtimeHours: Number(overtimeHours || 0),
          amount: 0,
          reason: reason.trim(),
        });

        setRequests((current) => [result.request, ...current]);
        setEmployeeName(initialEmployeeName);
        setSiteName("");
        setPeriodLabel("");
        setOvertimeHours("");
        setReason("");
        toast.success("Overtime request submitted.");
        window.dispatchEvent(new Event("payroll:pending-count-changed"));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to submit overtime request.",
        );
      }
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateForm();

    if (validation.hasErrors) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    setConfirmOpen(true);
  }

  return (
    <div className={`${styles.page} space-y-5`}>
      <WorkspacePageHeader eyebrow="Requests / Overtime" title="Request Overtime" description="Submit overtime hours and review the status of your requests." />

      <div className="mt-4 grid gap-4 overflow-x-hidden xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(320px,0.7fr)_minmax(0,1.3fr)] xl:items-stretch">
        <section className={`${styles.panel} h-fit p-5`}>
          <h2 className="text-lg font-semibold text-apple-charcoal">
            Overtime Request Form
          </h2>
          <form
            className="mt-4 grid gap-3 md:grid-cols-2"
            onSubmit={handleSubmit}
          >
            <label className="space-y-1 text-sm text-apple-smoke">
              <span className="font-medium text-apple-charcoal">
                Employee Name <span className="text-rose-500">*</span>
              </span>
              <input
                value={employeeName}
                onChange={(event) => {
                  setEmployeeName(event.target.value);
                  setFormErrors((current) => ({
                    ...current,
                    employeeName: undefined,
                  }));
                }}
                className={baseInputClass(Boolean(formErrors.employeeName))}
                placeholder="Enter employee name"
              />
              {formErrors.employeeName ? (
                <p className="text-xs font-medium text-rose-600">
                  {formErrors.employeeName}
                </p>
              ) : null}
            </label>

            <label className="space-y-1 text-sm text-apple-smoke">
              <span className="font-medium text-apple-charcoal">
                Site Name <span className="text-rose-500">*</span>
              </span>
              <input
                value={siteName}
                onChange={(event) => {
                  setSiteName(event.target.value);
                  setFormErrors((current) => ({
                    ...current,
                    siteName: undefined,
                  }));
                }}
                className={baseInputClass(Boolean(formErrors.siteName))}
                placeholder="Enter site"
              />
              {formErrors.siteName ? (
                <p className="text-xs font-medium text-rose-600">
                  {formErrors.siteName}
                </p>
              ) : null}
            </label>

            <label className="space-y-1 text-sm text-apple-smoke">
              <span className="font-medium text-apple-charcoal">
                Period Label (Optional)
              </span>
              <input
                value={periodLabel}
                onChange={(event) => setPeriodLabel(event.target.value)}
                className={baseInputClass(false)}
                placeholder="e.g. 2026-04-01 to 2026-04-15"
              />
            </label>

            <label className="space-y-1 text-sm text-apple-smoke">
              <span className="font-medium text-apple-charcoal">
                Work Date <span className="text-rose-500">*</span>
              </span>
              <input
                type="date"
                value={requestDate}
                onChange={(event) => {
                  setRequestDate(event.target.value);
                  setFormErrors((current) => ({
                    ...current,
                    requestDate: undefined,
                  }));
                }}
                className={baseInputClass(Boolean(formErrors.requestDate))}
              />
              {formErrors.requestDate ? (
                <p className="text-xs font-medium text-rose-600">
                  {formErrors.requestDate}
                </p>
              ) : null}
            </label>

            <label className="space-y-1 text-sm text-apple-smoke">
              <span className="font-medium text-apple-charcoal">
                Overtime Hours <span className="text-rose-500">*</span>
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={overtimeHours}
                onChange={(event) => {
                  const raw = event.target.value.replace(/[^0-9.-]/g, "");
                  setOvertimeHours(raw);
                  setFormErrors((current) => ({
                    ...current,
                    overtimeHours: undefined,
                  }));
                }}
                className={baseInputClass(Boolean(formErrors.overtimeHours))}
                placeholder="0.00"
              />
              {formErrors.overtimeHours ? (
                <p className="text-xs font-medium text-rose-600">
                  {formErrors.overtimeHours}
                </p>
              ) : null}
            </label>

            <label className="space-y-1 text-sm text-apple-smoke md:col-span-2">
              <span className="font-medium text-apple-charcoal">
                Reason (Optional)
              </span>
              <textarea
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setFormErrors((current) => ({
                    ...current,
                    reason: undefined,
                  }));
                }}
                rows={3}
                className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:border-teal-400 ${
                  formErrors.reason
                    ? "border-rose-300 bg-rose-50/40"
                    : "border-apple-mist bg-white"
                }`}
                placeholder="Describe why overtime is requested"
              />
              {formErrors.reason ? (
                <p className="text-xs font-medium text-rose-600">
                  {formErrors.reason}
                </p>
              ) : null}
            </label>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#076d69] px-4 text-sm font-semibold text-white transition hover:bg-[#055f5b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <LoaderCircle size={14} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Review Request"
                )}
              </button>
            </div>
          </form>
        </section>

        <OvertimeRequestHistory requests={sortedRequests} />
      </div>

      <OvertimeRequestConfirmDialog open={confirmOpen} pending={isPending} employeeName={employeeName} siteName={siteName} requestDate={requestDate} overtimeHours={overtimeHours} periodLabel={periodLabel} reason={reason} onClose={()=>setConfirmOpen(false)} onConfirm={submitRequest}/>

    </div>
  );
}

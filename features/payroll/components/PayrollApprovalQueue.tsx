"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Clock3, Loader2, MapPin, XCircle } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  approveOvertimeAdjustmentAction,
  rejectOvertimeAdjustmentAction,
} from "@/actions/payroll";

interface PendingOvertimeRequest {
  id: string;
  payroll_run_id: string;
  quantity: number;
  amount: number;
  notes: string | null;
  created_at: string;
  effective_date: string | null;
  payroll_runs:
    | {
        site_name: string;
        period_label: string;
      }
    | {
        site_name: string;
        period_label: string;
      }[]
    | null;
  payroll_run_items:
    | {
        employee_name: string;
        site_name: string;
      }
    | {
        employee_name: string;
        site_name: string;
      }[]
    | null;
}

interface PayrollApprovalQueueProps {
  role: "ceo" | "payroll_manager" | null;
  onRequestResolved?: (runId: string) => void;
}

function formatMoney(value: number): string {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getRelationValue<T extends object>(
  relation: T | T[] | null,
): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function formatRequestedAt(value: string): string {
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ApprovalQueueSkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={`approval-skeleton-${index}`}
          className="rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] p-4"
        >
          <div className="animate-pulse space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-4 w-28 rounded-full bg-apple-mist" />
                  <div className="h-6 w-28 rounded-full bg-apple-mist/80" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="h-3 w-24 rounded-full bg-apple-mist/80" />
                  <div className="h-3 w-32 rounded-full bg-apple-mist/80" />
                  <div className="h-3 w-24 rounded-full bg-apple-mist/80" />
                </div>
                <div className="h-3 w-40 rounded-full bg-apple-mist/70" />
                <div className="h-10 w-full rounded-xl border border-apple-mist bg-white/80" />
              </div>

              <div className="rounded-xl border border-apple-mist bg-white px-4 py-3">
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded-full bg-apple-mist/70" />
                  <div className="h-7 w-24 rounded-full bg-apple-mist" />
                  <div className="h-3 w-14 rounded-full bg-apple-mist/80" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-apple-mist pt-4">
              <div className="h-10 w-24 rounded-[10px] bg-apple-mist/80" />
              <div className="h-10 w-24 rounded-[10px] bg-apple-mist" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PayrollApprovalQueue({
  role,
  onRequestResolved,
}: PayrollApprovalQueueProps) {
  const [pendingRequests, setPendingRequests] = useState<
    PendingOvertimeRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadPendingRequests() {
      if (role !== "ceo") {
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("payroll_adjustments")
        .select(
          "id, payroll_run_id, quantity, amount, notes, created_at, effective_date, payroll_runs(site_name, period_label), payroll_run_items(employee_name, site_name)",
        )
        .eq("adjustment_type", "overtime")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        toast.error("Unable to load pending overtime approvals.");
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      setPendingRequests((data ?? []) as PendingOvertimeRequest[]);
      setLoading(false);
    }

    void loadPendingRequests();

    return () => {
      cancelled = true;
    };
  }, [role]);

  const hasRequests = useMemo(
    () => pendingRequests.length > 0,
    [pendingRequests.length],
  );

  function handleAction(adjustmentId: string, action: "approve" | "reject") {
    setPendingActionId(adjustmentId);
    startTransition(async () => {
      try {
        const result =
          action === "approve"
            ? await approveOvertimeAdjustmentAction(adjustmentId)
            : await rejectOvertimeAdjustmentAction(adjustmentId);

        toast.success(
          action === "approve"
            ? "Overtime request approved."
            : "Overtime request rejected.",
        );
        onRequestResolved?.(result.runId);
        setPendingRequests((prev) =>
          prev.filter((request) => request.id !== adjustmentId),
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to update overtime request.",
        );
      } finally {
        setPendingActionId(null);
      }
    });
  }

  if (role !== "ceo") return null;

  return (
    <section className="rounded-[14px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-widest text-apple-steel">
            CEO Approval Queue
          </p>
          <h2 className="mt-1 text-xl font-bold text-apple-charcoal">
            Pending Overtime Requests
          </h2>
          <p className="mt-1 text-sm text-apple-smoke">
            Review overtime requests while payroll stays saved and visible in
            history.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <Clock3 size={14} />
          {pendingRequests.length} pending
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <ApprovalQueueSkeleton />
        ) : !hasRequests ? (
          <p className="text-sm text-apple-steel">
            No overtime requests are waiting for approval.
          </p>
        ) : (
          pendingRequests.map((request) => {
            const run = getRelationValue(request.payroll_runs);
            const item = getRelationValue(request.payroll_run_items);
            const busy = isPending && pendingActionId === request.id;
            const siteLabel =
              item?.site_name?.trim() || run?.site_name || "Unknown Site";

            return (
              <div
                key={request.id}
                className="group rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] p-5 shadow-[0_8px_20px_rgba(24,83,43,0.04)] transition-all w-fit"
              >
                <div className="grid gap-6 ">
                  <div className="min-w-0 space-y-3">
                    {/* Header: Name & Status */}
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-[15px] font-bold tracking-tight text-apple-charcoal">
                        {item?.employee_name ?? "Unknown Employee"}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200/40">
                        <Clock3 size={12} strokeWidth={2.5} />
                        Pending Approval
                      </span>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-apple-steel">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-apple-smoke" />
                        {siteLabel}
                      </div>
                      <div className="hidden h-3 w-px bg-apple-mist lg:block" />
                      <div className="font-medium">
                        {run?.period_label ?? "Unknown Period"}
                      </div>
                    </div>

                    {/* Request Date & Notes */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium text-apple-smoke/80">
                        Requested {formatRequestedAt(request.created_at)}
                      </p>
                      {request.notes && (
                        <div className="relative rounded-xl border border-apple-mist/50 bg-blue-50 px-3.5 py-2.5 text-xs italic  shadow-sm">
                          &quot;{request.notes}&quot;
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Highlight Card */}
                  <div className="flex flex-col justify-center rounded-2xl border border-apple-mist bg-white p-4 shadow-sm lg:self-start">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-apple-steel/80">
                      Overtime Pay
                    </p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-black tracking-tight text-apple-charcoal">
                        {formatMoney(request.amount)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-apple-smoke">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {request.quantity.toLocaleString("en-PH")} total hr
                      {request.quantity === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 ">
                  <div className="text-[11px] text-apple-steel italic">
                    Review required before payroll cutoff
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAction(request.id, "reject")}
                      disabled={busy}
                      className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold text-red-600 transition-colors bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:opacity-50"
                      aria-label={`Reject overtime request for ${item?.employee_name ?? "employee"}`}
                    >
                      {busy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAction(request.id, "approve")}
                      disabled={busy}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1f6a37] px-5 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition-all hover:bg-[#18552d] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                      aria-label={`Approve overtime request for ${item?.employee_name ?? "employee"}`}
                    >
                      {busy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      Approve Request
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

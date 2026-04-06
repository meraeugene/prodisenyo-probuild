"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import PayrollApprovalQueue from "@/features/payroll/components/PayrollApprovalQueue";

export default function OvertimeApprovalsPageClient() {
  const [refreshToken, setRefreshToken] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isRefreshing) return;
    const timeout = window.setTimeout(() => setIsRefreshing(false), 600);
    return () => window.clearTimeout(timeout);
  }, [isRefreshing]);

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Approvals"
        title="Overtime Approvals"
        description="Review overtime requests submitted from saved HR payroll runs and keep approval history tied to the correct pay period."
        actions={
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              setRefreshToken((value) => value + 1);
            }}
            disabled={isRefreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[rgb(var(--theme-chart-5))] px-4 text-sm font-semibold text-[rgb(var(--apple-black))] transition hover:bg-[rgb(var(--apple-silver))] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
            />
            Sync
          </button>
        }
      />

      <PayrollApprovalQueue
        role="ceo"
        refreshToken={refreshToken}
      />
    </div>
  );
}

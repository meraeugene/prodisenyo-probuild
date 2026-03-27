"use client";

import { useEffect, useState } from "react";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import PayrollApprovalQueue from "@/features/payroll/components/PayrollApprovalQueue";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function OvertimeApprovalsPage() {
  const [role, setRole] = useState<"ceo" | "payroll_manager" | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        setRole(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      setRole((data as { role: "ceo" | "payroll_manager" } | null)?.role ?? null);
    }

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Approvals"
        title="Overtime Approvals"
        description="Review overtime requests submitted from saved HR payroll runs and keep approval history tied to the correct pay period."
      />

      <PayrollApprovalQueue role={role} />
    </div>
  );
}

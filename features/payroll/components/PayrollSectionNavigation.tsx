"use client";
import { BarChart3, ClipboardCheck } from "lucide-react";
import WorkspaceRouteTabs from "@/components/workspace/WorkspaceRouteTabs";
export default function PayrollSectionNavigation() {
  return <WorkspaceRouteTabs label="Payroll sections" items={[
    { href: "/payroll-analytics", label: <><BarChart3 size={15} aria-hidden="true" />Analytics</>, color: "#076d69" },
    { href: "/payroll-approvals", label: <><ClipboardCheck size={15} aria-hidden="true" />Approvals</>, color: "#a66b12" },
  ]} />;
}
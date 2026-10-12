"use client";
import type { ReactNode } from "react";
import WorkspaceDialog from "@/components/workspace/WorkspaceDialog";
import styles from "@/components/workspace/workspace.module.css";
import CostEstimatorBoqTable from "./CostEstimatorBoqTable";
import EstimateStatusBadge from "./EstimateStatusBadge";
import { formatBudgetMoney, formatEstimateDateTime, formatProjectTypeLabel } from "../utils/costEstimatorFormatters";
import type { ProjectEstimateItemRow, ProjectEstimateRow, ReviewProjectEstimateRow } from "../types";

export default function EstimateReportModal({ estimate, items, onClose, footer }: {
  estimate: ProjectEstimateRow & { requester_profile?: ReviewProjectEstimateRow["requester_profile"] };
  items: ProjectEstimateItemRow[]; onClose: () => void; footer?: ReactNode;
}) {
  return <WorkspaceDialog title={`${estimate.project_name} — Estimate report`} description="Project information and a complete breakdown of the Bill of Quantities." size="xl" onClose={onClose}
    footer={<><button type="button" onClick={onClose} className={styles.button}>Close report</button>{footer}</>}>
    <div className="space-y-5">
      <section className={styles.panel}>
        <div className={styles.sectionHeader}><h3 className={styles.sectionTitle}>Project summary</h3><EstimateStatusBadge status={estimate.status} /></div>
        <dl className="grid grid-cols-2 gap-5 p-5 lg:grid-cols-4">
          {[{ label: "Project type", value: formatProjectTypeLabel(estimate.project_type) }, { label: "Total estimate", value: formatBudgetMoney(estimate.estimate_total) }, { label: "Location", value: estimate.location || "Not recorded" }, { label: "Submitted", value: formatEstimateDateTime(estimate.submitted_at) }, { label: "Owner", value: estimate.owner_name || "Not recorded" }, { label: "Prepared by", value: estimate.requester_profile?.full_name || estimate.requester_profile?.username || "Assigned engineer" }].map(fact => <div key={fact.label} className="min-w-0"><dt className="text-xs text-slate-500">{fact.label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-800">{fact.value}</dd></div>)}
        </dl>
        {estimate.notes && <p className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">{estimate.notes}</p>}
      </section>
      {estimate.status === "rejected" && <section className="rounded-[7px] border border-amber-200 bg-amber-50 px-4 py-3"><h3 className="text-sm font-medium text-amber-900">Review notes</h3><p className="mt-1 text-sm leading-6 text-amber-800">{estimate.rejection_reason?.trim() || "No review notes were provided."}</p></section>}
      <CostEstimatorBoqTable items={items} />
    </div>
  </WorkspaceDialog>;
}

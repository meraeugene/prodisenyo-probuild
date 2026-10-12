import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EngineerDashboardMaterialRequest } from "@/features/engineer-dashboard/types";
import { formatDashboardDate } from "@/features/engineer-dashboard/utils/engineerDashboard";
import { cn } from "@/lib/utils";
import styles from "@/components/workspace/workspace.module.css";

export default function EngineerDashboardRequests({ requests }: { requests: EngineerDashboardMaterialRequest[] }) {
  return (
    <section className={`${styles.panel} flex min-h-72 flex-col p-5`}>
      <h2 className={styles.sectionTitle}>Material requests</h2>
      <p className={styles.sectionDescription}>Recent requests for the selected project.</p>
      <div className="mt-4 flex-1 space-y-3">
        {requests.length === 0 ? <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No material requests for this project.</p> : requests.slice(0, 4).map((request) => (
          <div key={request.id} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0">
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{request.materialName}</p><p className="mt-0.5 truncate text-xs text-slate-500">{request.projectName}</p><p className="mt-1 text-xs text-slate-500">{request.quantity} {request.unit} · {formatDashboardDate(request.createdAt)}</p></div>
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize", request.status === "rejected" ? "bg-rose-50 text-rose-700" : request.status === "submitted" ? "bg-amber-50 text-amber-700" : request.status === "received" ? "bg-teal-50 text-teal-700" : "bg-sky-50 text-sky-700")}>{request.status}</span>
          </div>
        ))}
      </div>
      <Link href="/request-material" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900">View all requests <ArrowRight size={15} /></Link>
    </section>
  );
}

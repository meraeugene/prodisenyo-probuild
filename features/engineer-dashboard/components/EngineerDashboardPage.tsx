"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, FolderKanban } from "lucide-react";
import WorkspacePageHeader from "@/components/workspace/WorkspacePageHeader";
import styles from "@/components/workspace/workspace.module.css";
import type { EngineerDashboardData } from "@/features/engineer-dashboard/types";
import EngineerDashboardAlerts from "./EngineerDashboardAlerts";
import EngineerDashboardProjects from "./EngineerDashboardProjects";
import EngineerDashboardRequests from "./EngineerDashboardRequests";
import EngineerDashboardSummary from "./EngineerDashboardSummary";

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Engineer";
}

export default function EngineerDashboardPage({ data }: { data: EngineerDashboardData }) {
  const [projectId, setProjectId] = useState("all");
  const visibleRequests = data.materialRequests.filter((request) => projectId === "all" || request.projectId === projectId);
  const visibleAlerts = data.alerts.filter((alert) => projectId === "all" || alert.projectId === projectId);

  return (
    <div className={styles.page}>
      <div className="space-y-5">
        <WorkspacePageHeader eyebrow="Engineer / Overview" title="Engineer Dashboard" description={`Good day, Engr. ${getFirstName(data.fullName)}. Track assigned projects, estimates, and material requests.`}
          actions={<><Link href="/projects" className={styles.button}><FolderKanban size={15} aria-hidden="true" />Projects</Link><Link href="/cost-estimator" className={styles.primaryButton}><Calculator size={15} aria-hidden="true" />Cost estimator</Link></>} />
        <EngineerDashboardSummary values={{ projects: data.projects.length, active: data.projects.filter((project) => project.status === "active").length, estimates: data.projects.filter((project) => project.status === "planning").length, completed: data.projects.filter((project) => project.status === "completed").length, onHold: data.projects.filter((project) => project.status === "on_hold").length }} />
        <EngineerDashboardProjects projects={data.projects} selectedProjectId={projectId} onSelectedProjectIdChange={setProjectId} />
        <div className="grid gap-5 lg:grid-cols-2"><EngineerDashboardRequests requests={visibleRequests} /><EngineerDashboardAlerts alerts={visibleAlerts} /></div>
      </div>
    </div>
  );
}

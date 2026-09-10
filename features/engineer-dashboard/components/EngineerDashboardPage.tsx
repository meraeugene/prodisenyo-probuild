"use client";

import { useState } from "react";
import DashboardPageHero from "@/components/DashboardPageHero";
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
    <main className="min-h-full bg-[#f7f9fc] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <DashboardPageHero eyebrow="Engineer workspace" title="Engineer Dashboard" description={`Good day, Engr. ${getFirstName(data.fullName)}. Track assigned projects, estimates, and material requests.`} />
        <EngineerDashboardSummary values={{ projects: data.projects.length, active: data.projects.filter((project) => project.status === "active" || project.status === "on_hold").length, estimates: data.projects.filter((project) => project.status === "planning").length, completed: data.projects.filter((project) => project.status === "completed").length }} />
        <EngineerDashboardProjects projects={data.projects} selectedProjectId={projectId} onSelectedProjectIdChange={setProjectId} />
        <div className="grid gap-5 lg:grid-cols-2"><EngineerDashboardRequests requests={visibleRequests} /><EngineerDashboardAlerts alerts={visibleAlerts} /></div>
      </div>
    </main>
  );
}

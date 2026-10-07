import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import DashboardShell from "@/components/DashboardShell";
import CeoProjectsOverview from "@/features/projects/components/CeoProjectsOverview";
import CeoGmeaProjectsPageClient from "@/features/gmea-projects/components/CeoGmeaProjectsPageClient";
import CeoRentalWorkspace from "@/features/gmea-rentals/components/CeoRentalWorkspace";
import CeoPageHeader from "@/features/ceo-workspace/components/CeoPageHeader";
import CeoDashboardPage from "@/features/ceo-dashboard/components/CeoDashboardPage";
import { projects, gmeaProjects, rentals, equipment, overtimeRequests, payrollAdjustments } from "./fixtures";
import OvertimeApprovalsPageClient from "@/features/payroll/components/OvertimeApprovalsPageClient";

Object.assign(window, { __gmeaProjects: gmeaProjects });
function Harness() {
  const [rows, setRows] = useState(projects);
  useEffect(() => {
    const update = () => setRows(projects.slice(0, 3));
    window.addEventListener("shrink-projects", update);
    return () => window.removeEventListener("shrink-projects", update);
  }, []);
  const role = new URLSearchParams(window.location.search).get("role") === "engineer" ? "engineer" : "ceo";
  const path = window.location.pathname;
  return <DashboardShell profile={{ id: "ceo", full_name: "Maria Santos", username: "ceo", role, avatar_path: null }}>
    {path === "/overtime-approvals" ? <OvertimeApprovalsPageClient initialRequests={payrollAdjustments} initialOvertimeRequests={overtimeRequests} />
      : path === "/gmea-projects" ? <CeoGmeaProjectsPageClient projects={gmeaProjects} />
      : path === "/gmea-rentals" ? <div className="space-y-5 p-6"><CeoPageHeader eyebrow="GMEA / Rentals" title="Rentals" description="Track rental schedules, equipment availability, and collections." /><CeoRentalWorkspace rentals={rentals} equipment={equipment} /></div>
      : path === "/dashboard" ? <CeoDashboardPage fullName="Maria Santos" data={{ projects: projects.map((project) => ({ ...project, estimatedCost: project.budget, latestProgressAt: null, imageUrl: null })), materialRequests: [], estimates: [], progressUpdates: [], documents: [], payrollApprovalCount: 2, overtimeApprovalCount: 1 }} />
      : <div className="p-4 sm:p-6"><CeoProjectsOverview projects={rows} onCreateProject={() => window.dispatchEvent(new Event("create-project"))} onOpenProject={(id) => Object.assign(window, { __openedProject: id })} /></div>}
  </DashboardShell>;
}
createRoot(document.getElementById("root")!).render(<Harness />);

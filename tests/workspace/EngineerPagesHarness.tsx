import { useState } from "react";
import EngineerWorkflowHarness from "./EngineerWorkflowHarness";
import EngineerDashboardPage from "@/features/engineer-dashboard/components/EngineerDashboardPage";
import EngineerProjectPortfolio from "@/features/projects/components/EngineerProjectPortfolio";
import EngineerProjectOverview from "@/features/projects/components/EngineerProjectOverview";
import ProjectWorkspaceHeader from "@/features/projects/components/ProjectWorkspaceHeader";
import CostEstimatorProjectsOverview from "@/features/cost-estimator/components/CostEstimatorProjectsOverview";
import CostEstimatorDraftWorkspace from "@/features/cost-estimator/components/CostEstimatorDraftWorkspace";
import CostEstimatorBoqDetails from "@/features/cost-estimator/components/CostEstimatorBoqDetails";
import type { AssignedEstimateProject, ProjectEstimateRow } from "@/features/cost-estimator/types";
import { EMPTY_ESTIMATE_FORM } from "@/features/cost-estimator/types";
import { projects } from "../ceo/fixtures";
import styles from "@/components/workspace/workspace.module.css";

const assignedProjects: AssignedEstimateProject[] = projects.slice(0, 8).map(project => ({ id: project.id, name: project.name, location: project.location, clientName: project.client, subject: "Construction", lead: null, budgetCeiling: project.budget }));
const estimates: ProjectEstimateRow[] = assignedProjects.slice(0, 6).map((project, index) => ({
  id: `estimate-${index}`, project_id: project.id, project_name: project.name, project_type: "new_build", client_name: project.clientName, location: project.location, owner_name: "Client", notes: "Check quantities", status: (["draft", "submitted", "approved", "rejected"] as const)[index % 4],
  estimate_total: index === 0 ? project.budgetCeiling + 100000 : 500000, requested_by: "engineer", submitted_at: null, approved_by: null, approved_at: null, rejected_at: null, rejection_reason: index === 3 ? "Revise quantities" : null, budget_project_id: null, source_estimate_id: null, created_at: "2026-10-01", updated_at: `2026-10-0${index + 1}`,
}));

export default function EngineerPagesHarness() {
  const path = window.location.pathname;
  const empty = new URLSearchParams(window.location.search).has("empty");
  const [opened, setOpened] = useState("");
  const [saveMessage, setSaveMessage] = useState("All changes saved");
  if (["estimator-workflow", "workspace", "materials", "overtime", "settings", "reset"].some(route => path.endsWith(route))) return <EngineerWorkflowHarness />;
  if (path.endsWith("dashboard")) return <EngineerDashboardPage data={{ fullName: "Maria Santos", projects: empty ? [] : projects.map(project => ({ ...project, imageUrl: null })), estimates: [],
    materialRequests: empty ? [] : projects.slice(0, 2).map((project, index) => ({ id: `request-${index}`, projectId: project.id, projectName: project.name, materialName: index === 0 ? "Concrete" : "Steel", quantity: 10, unit: "bags", status: "submitted", createdAt: "2026-10-07" })),
    alerts: empty ? [] : [{ id: "alert", projectId: projects[0].id, title: "Estimate returned", detail: "Revise quantities", kind: "estimate", createdAt: "2026-10-07", href: `/cost-estimator?projectId=${projects[0].id}` }],
  }} />;
  if (path.endsWith("projects")) return <div className={styles.page}><EngineerProjectPortfolio projects={empty ? [] : projects} onOpenProject={setOpened} /><output aria-label="Opened project">{opened}</output></div>;
  if (path.endsWith("project-detail")) return <div className={`${styles.page} space-y-5`}><ProjectWorkspaceHeader project={projects[1]} /><EngineerProjectOverview project={projects[1]} activities={[]} submissions={[]} budgetItems={[{ id: "budget", actual_spent: 500000 }]} materialRequests={[]} progressUpdates={[]} canUpdateProgress onUpdateProgress={() => setOpened("progress")} onOpenMaterials={() => setOpened("materials")} /><output aria-label="Opened section">{opened}</output></div>;
  if (path.endsWith("draft")) return <CostEstimatorDraftWorkspace estimate={estimates[0]} form={{ ...EMPTY_ESTIMATE_FORM, projectId: projects[0].id, projectName: projects[0].name, projectType: "new_build", location: projects[0].location, ownerName: "Client", draftedDate: "2026-10-01" }} linkedProject={assignedProjects[0]} catalogItems={[]} disabled={false} saveMessage={saveMessage} submitting={false} onBack={() => setSaveMessage("Back to overview")} onFieldChange={() => {}} onAdd={() => setSaveMessage("Add item opened")} onEdit={() => {}} onDeleteItem={() => {}} onSave={() => setSaveMessage("Draft saved")} onSubmit={() => setSaveMessage("Submit requested")} onDeleteDraft={() => setSaveMessage("Delete requested")} />;
  if (path.endsWith("boq")) return <CostEstimatorBoqDetails estimate={estimates[3]} items={[]} budgetCeiling={assignedProjects[3].budgetCeiling} pending={false} onBack={() => setOpened("overview")} onViewReport={() => setOpened("report")} onEdit={() => setOpened("edit")} />;
  return <><CostEstimatorProjectsOverview estimates={empty ? [] : estimates} assignedProjects={empty ? [] : assignedProjects} itemsByEstimateId={{}} pending={false} onOpenProject={setOpened} onStartEstimate={setOpened} /><output aria-label="Opened estimate">{opened}</output></>;
}

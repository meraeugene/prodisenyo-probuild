import CostEstimatorPageClient from "@/features/cost-estimator/components/CostEstimatorPageClient";
import ProjectWorkspaceClient from "@/features/projects/components/ProjectWorkspaceClient";
import MaterialRequestPageClient from "@/features/material-requests/components/MaterialRequestPageClient";
import OvertimeRequestPageClient from "@/features/overtime-requests/components/OvertimeRequestPageClient";
import SettingsPageClient from "@/features/settings/components/SettingsPageClient";
import SettingsResetWorkspaceModal from "@/features/settings/components/SettingsResetWorkspaceModal";
import { projects, overtimeRequests } from "../ceo/fixtures";
import type { AssignedEstimateProject, ProjectEstimateItemRow, ProjectEstimateRow } from "@/features/cost-estimator/types";
import type { ProjectDocumentRecord } from "@/features/project-documents/types";
import type { ProjectProgressUpdateRecord } from "@/features/projects/progressUpdateTypes";

const project = projects[1];
const assigned: AssignedEstimateProject[] = projects.slice(0, 4).map(project => ({ id: project.id, name: project.name, location: project.location, clientName: project.client, subject: null, lead: null, budgetCeiling: project.budget }));
const estimates: ProjectEstimateRow[] = assigned.map((project, index) => ({
  id: `workflow-${index}`, project_id: project.id, project_name: project.name, project_type: "new_build", location: project.location, owner_name: project.clientName, client_name: project.clientName, notes: "Check quantities", status: (["draft", "approved", "submitted", "rejected"] as const)[index], estimate_total: 35000,
  requested_by: "engineer", created_at: "2026-10-01", updated_at: "2026-10-07", submitted_at: "2026-10-05", rejected_at: index === 3 ? "2026-10-07" : null, rejection_reason: index === 3 ? "Revise material quantities." : null, approved_by: null, approved_at: null, budget_project_id: null, source_estimate_id: null,
}));
const items: ProjectEstimateItemRow[] = estimates.map((estimate, index) => ({ id: `item-${index}`, estimate_id: estimate.id, catalog_item_id: "cement", item_name_snapshot: "Concrete slab", category_snapshot: "materials", unit_label_snapshot: "bags", unit_cost_snapshot: 350, quantity: 100, line_total: 35000, notes: "Ground floor", sort_order: 0, material_name_snapshot: "Portland cement", material_id_snapshot: "cement", boq_section: "Structural Works", boq_item_number: "1", pricing_basis: "catalog", reference_supplier: null, reference_quotation: null, created_at: "2026-10-01", updated_at: "2026-10-01" }));
const updates: ProjectProgressUpdateRecord[] = [{ id: "update", project_id: project.id, submitted_by: "engineer", overall_percent: 35, completed_work_summary: "Foundation work completed", remarks: "Ready for next phase", progress_date: "2026-10-07", created_at: "2026-10-07" }];
const documents: ProjectDocumentRecord[] = [{ id: "document", project_id: project.id, uploaded_by: "engineer", uploader_name: "Maria Santos", file_name: "Foundation plans.pdf", storage_path: "plans.pdf", mime_type: "application/pdf", file_size: 123456, category: "plans", created_at: "2026-10-07" }];
const data = { activities: [{ id: "activity", activity: "Foundation", weight_percent: 40, progress_percent: 100 }], estimates: [], estimateItems: [], budgetItems: [], progressSubmissions: [], materialRequests: [], progressUpdates: updates, documents, projectExpenses: [], purchaseOrders: [], materialReceipts: [] };
Object.assign(window, { __engineerWorkspace: data, __engineerNotifications: { estimates } });

export default function EngineerWorkflowHarness() {
  const route = window.location.pathname.split("/").pop();
  if (route === "estimator-workflow") return <CostEstimatorPageClient estimates={estimates} items={items} catalogItems={[{id:"cement",name:"Portland cement",category:"materials",unit_label:"bags",unit_cost:350,notes:null,is_active:true,created_by:"engineer",updated_by:null,created_at:"2026-10-01",updated_at:"2026-10-01"}]} assignedProjects={assigned} initialProjectId="" />;
  if (route === "workspace") return <ProjectWorkspaceClient project={project} currentUserId="engineer" canUpdateProgress canCreateEstimate canReviewEstimates={false} {...data} />;
  if (route === "materials") return <MaterialRequestPageClient initialRequests={[]} projects={assigned} defaultProjectId={project.id} />;
  if (route === "overtime") return <OvertimeRequestPageClient initialEmployeeName="Maria Santos" initialRequests={overtimeRequests} />;
  if (route === "reset") return <SettingsResetWorkspaceModal open onClose={() => {}} onConfirm={() => {}} />;
  return <SettingsPageClient initialProfile={{ full_name: "Maria Santos", username: "maria", email: "maria@example.test", avatar_path: null, role: "engineer" }} />;
}

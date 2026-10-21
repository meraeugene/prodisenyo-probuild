import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import GmeaModalValidationHarness from "./GmeaModalValidationHarness";
import EngineerPagesHarness from "./EngineerPagesHarness";
import ProjectsPageClient from "@/features/projects/components/ProjectsPageClient";
import DashboardShell from "@/components/DashboardShell";
import DashboardPageHero from "@/components/DashboardPageHero";
import PayrollWorkspaceRunsPanel from "@/features/payroll-dashboard/components/PayrollWorkspaceRunsPanel";
import UserManagementPageClient from "@/features/user-management/components/UserManagementPageClient";
import OvertimeRequestPageClient from "@/features/overtime-requests/components/OvertimeRequestPageClient";
import PurchasingWorkspace from "@/features/purchasing-approvals/components/PurchasingWorkspace";
import GmeaProjectsPageClient from "@/features/gmea-projects/components/GmeaProjectsPageClient";
import CeoGmeaProjectsPageClient from "@/features/gmea-projects/components/CeoGmeaProjectsPageClient";
import GmeaProjectMetricPage from "@/features/gmea-projects/components/GmeaProjectMetricPage";
import OvertimeApprovalsPageClient from "@/features/payroll/components/OvertimeApprovalsPageClient";
import PayrollReportsPageClient from "@/features/payroll-reports/components/PayrollReportsPageClient";
import GmeaRentalsPage from "@/features/gmea-rentals/components/GmeaRentalsPage";
import type { SidebarProfile } from "@/features/navigation/types";
import type { ManagedUserRow } from "@/features/user-management/types";
import type { PayrollWorkspaceRun } from "@/features/payroll-dashboard/types";
import type { PurchasingRecord } from "@/actions/purchasing";
import { projects, gmeaProjects, rentals, equipment, overtimeRequests, payrollAdjustments } from "../ceo/fixtures";
import PayrollHarness from "./PayrollHarness";
import EngineeringWorkspace from "@/features/projects/components/EngineeringWorkspace";
import GmeaProjectWorkspace from "@/features/gmea-projects/components/GmeaProjectWorkspace";
import GeneratePayrollSkeleton from "@/features/payroll/components/generate-payroll/GeneratePayrollSkeleton";
import { useState } from "react";
import SkeletonHarness from "./SkeletonHarness";
import PayrollWorkflowNavigation from "@/features/payroll/components/generate-payroll/PayrollWorkflowNavigation";
import WorkspaceLoadingScreen from "@/components/WorkspaceLoadingScreen";
import { rentalExpenses, rentalExpenseCategories } from "./rentalExpenseFixtures";
import { weeklyRentalExpenses } from "./weeklyRentalExpenseFixtures";
import { operationExpenses } from "./operationExpenseFixtures";
import OperationExpensesPageClient from "@/features/gmea-operation-expenses/components/OperationExpensesPageClient";
import GmeaDashboardPageClient from "@/features/gmea-dashboard/components/GmeaDashboardPageClient";
import type { RentalSection } from "@/features/gmea-rentals/utils/rentalSections";
import { incomeRentals, historicalIncome } from "./rentalIncomeFixtures";
import { payrollReports, payrollInsightRows, payrollInsightAttendance } from "./payrollReportFixtures";

function EngineerHarness() {
  const [tab, setTab] = useState<"progress" | "materials">("progress");
  return <div className="p-4 sm:p-6"><EngineeringWorkspace project={projects[0]} tab={tab} activities={[]} materialsCount={0}
    materialContent={<p>Materials workspace</p>} onBack={() => {}} onTabChange={setTab} onSubmitProgress={() => {}} /></div>;
}

const users: ManagedUserRow[] = projects.map((project, index) => ({
  id: project.id, full_name: index === 0 ? "Harbor User" : `User ${String(index + 1).padStart(2, "0")}`,
  username: `user${index}`, email: `user${index}@example.test`, role: index % 2 ? "employee" : "admin", is_active: index % 3 !== 0, created_at: "2026-10-01",
}));
const payrolls: PayrollWorkspaceRun[] = projects.map((project, index) => ({
  id: project.id, attendanceImportId: `import-${index}`, siteName: project.location, periodLabel: project.name,
  periodStart: project.startDate, periodEnd: project.endDate, status: (["draft", "submitted", "approved", "rejected"] as const)[index % 4], netTotal: project.budget, updatedAt: "2026-10-07",
}));
const purchases: PurchasingRecord[] = projects.map((project, index) => ({
  id: project.id, projectId: project.id, projectName: project.name, materialRequestId: null, itemName: `Material ${index + 1}`, quantity: 2, unit: "bags",
  supplierName: "Hardware Co.", estimatedUnitCost: 100, actualUnitCost: 120, quotationReference: `Q-${index}`, status: index % 2 ? "ordered" : "received",
  deliveryStatus: index % 2 ? "scheduled" : "delivered", receiptInvoiceReference: "INV-1", receiptFile: null, notes: "", updatedAt: "2026-10-07",
}));
Object.assign(window, { __gmeaProjects: gmeaProjects, __equipment: equipment, __rentals: incomeRentals, __historicalIncome: historicalIncome,
  __payrollReports: payrollReports, __payrollInsightRows: payrollInsightRows, __payrollInsightAttendance: payrollInsightAttendance,
  __rentalOperations: { equipment, workers: [], categories: rentalExpenseCategories, expenses: new URLSearchParams(window.location.search).has("weekly-format") ? weeklyRentalExpenses : rentalExpenses }, __operationExpenses: operationExpenses, __purchases: purchases });
const path = window.location.pathname;
const skeletonCase = new URLSearchParams(window.location.search).get("case") || "";
const homeRole = skeletonCase.startsWith("home-") ? skeletonCase.slice(5) as SidebarProfile["role"] : null;
const skeletonRole: SidebarProfile["role"] = homeRole || (skeletonCase.startsWith("engineer") ? "engineer" : ["admin", "reset"].includes(skeletonCase) ? "admin" : skeletonCase.startsWith("purchas") ? "purchaser" : skeletonCase === "overtime-request" ? "employee" : skeletonCase.startsWith("gmea") ? "gmea" : ["payroll-workspace", "generate-payroll", "upload-attendance", "review-attendance"].includes(skeletonCase) ? "payroll_manager" : "ceo");
const role: SidebarProfile["role"] = path === "/request-overtime" ? (new URLSearchParams(window.location.search).get("role") as SidebarProfile["role"]) : new URLSearchParams(window.location.search).get("role") === "ceo" ? "ceo" : path === "/skeletons" ? skeletonRole : path === "/engineer" ? "engineer" : path === "/admin" ? "admin" : ["/payroll", "/generate-payroll", "/payroll-loading"].includes(path) ? "payroll_manager" : path === "/employee" ? "employee" : path === "/purchaser" ? "purchaser" : "gmea";
createRoot(document.getElementById("root")!).render(path === "/loading-logo" ? <WorkspaceLoadingScreen /> : <DashboardShell profile={{ id: "project-01", full_name: "Maria Santos", username: "maria", role: path.startsWith("/engineer-pages/") ? "engineer" : role, avatar_path: null }}>
  <Toaster position="top-right" />
  {path === "/gmea-modal-validation" ? <GmeaModalValidationHarness /> : path.startsWith("/engineer-pages/") ? <EngineerPagesHarness /> : path === "/admin" ? <UserManagementPageClient initialUsers={users} currentUserId="project-01" />
    : path === "/project-create" ? <ProjectsPageClient role="ceo" fullName="Maria Santos" projects={projects} engineers={[{ id: "engineer-1", name: "Engineer One" }]} />
    : path === "/engineer" ? <EngineerHarness />
    : path === "/generate-payroll" ? <><PayrollWorkflowNavigation current={3} /><PayrollHarness /></>
    : path === "/attendance-review" ? <PayrollWorkflowNavigation current={2} />
    : path === "/skeletons" ? <SkeletonHarness />
    : path === "/payroll-loading" ? <GeneratePayrollSkeleton />
    : path === "/gmea-project" ? <GmeaProjectWorkspace project={{ ...gmeaProjects[0], color: "#CC0000" }} expenseOptions={{ invoiceNames: [], suppliers: [], methods: [] }} canEdit />
    : path === "/purchaser" ? <PurchasingWorkspace />
    : path === "/overtime-approvals" ? <OvertimeApprovalsPageClient initialRequests={payrollAdjustments} initialOvertimeRequests={overtimeRequests} />
    : path === "/payroll-approvals" ? <PayrollReportsPageClient initialData={{ reports: payrollReports }} initialView={new URLSearchParams(window.location.search).get("view") === "analytics" ? "analytics" : "records"} />
    : path === "/gmea-projects/metrics/ongoing" ? <GmeaProjectMetricPage projects={gmeaProjects} metric="ongoing" canEdit={role === "gmea"} />
    : path === "/gmea-projects" ? role === "ceo" ? <CeoGmeaProjectsPageClient projects={gmeaProjects} /> : <GmeaProjectsPageClient projects={gmeaProjects} canEdit />
    : path === "/gmea-dashboard" ? <GmeaDashboardPageClient initialData={{ projects: gmeaProjects, rentalIncome: [...incomeRentals, ...historicalIncome], rentalExpenses, operationExpenses }} />
    : path === "/gmea-operation-expenses" ? <OperationExpensesPageClient initialExpenses={operationExpenses} canEdit={role === "gmea"} />
    : path.startsWith("/gmea-rentals") ? <GmeaRentalsPage key={path} section={(path.split("/")[2] || "income") as RentalSection} equipment={equipment} rentals={incomeRentals} historicalIncome={historicalIncome} initialOperations={{ equipment, workers: [], categories: rentalExpenseCategories, expenses: new URLSearchParams(window.location.search).has("weekly-format") ? weeklyRentalExpenses : rentalExpenses }} canEdit={role === "gmea"} />
    : path === "/request-overtime" || role === "employee" ? <OvertimeRequestPageClient initialRequests={overtimeRequests} initialEmployeeName="Juan Santos" />
    : <div className="space-y-5 p-4 sm:p-6"><DashboardPageHero eyebrow="Workspace" title="Payroll" description="Manage your records." />
      <PayrollWorkspaceRunsPanel runs={payrolls} /></div>}
</DashboardShell>);

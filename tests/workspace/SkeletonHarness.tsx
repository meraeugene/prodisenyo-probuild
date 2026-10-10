import type { ReactNode } from "react";
import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { DashboardOverviewSkeleton, AnalyticsPageSkeleton } from "@/components/DashboardLoadingSkeleton";
import CeoDashboardSkeleton from "@/features/ceo-dashboard/components/CeoDashboardSkeleton";
import HomePageSkeleton from "@/features/home/components/HomePageSkeleton";
import UserManagementSkeleton from "@/features/user-management/components/UserManagementSkeleton";
import EngineerDashboardSkeleton from "@/features/engineer-dashboard/components/EngineerDashboardSkeleton";
import EngineerProjectsPageSkeleton from "@/features/projects/components/EngineerProjectsPageSkeleton";
import ProjectsPageSkeleton from "@/features/projects/components/ProjectsPageSkeleton";
import ProjectWorkspaceSkeleton from "@/features/projects/components/ProjectWorkspaceSkeleton";
import ProjectWorkspaceTabSkeleton from "@/features/projects/components/ProjectWorkspaceTabSkeleton";
import MaterialRequestPageSkeleton from "@/features/material-requests/components/MaterialRequestPageSkeleton";
import CostEstimatorPageSkeleton from "@/features/cost-estimator/components/CostEstimatorPageSkeleton";
import CostEstimatorProjectsOverviewSkeleton from "@/features/cost-estimator/components/CostEstimatorProjectsOverviewSkeleton";
import EstimateReviewsSectionSkeleton from "@/features/cost-estimator/components/EstimateReviewsSectionSkeleton";
import EstimateReviewsTableSkeleton from "@/features/cost-estimator/components/EstimateReviewsTableSkeleton";
import BudgetTrackerLoadingState from "@/features/budget-tracker/components/BudgetTrackerLoadingState";
import PayrollDashboardSkeleton from "@/features/payroll-dashboard/components/PayrollDashboardSkeleton";
import PayrollWorkspaceSkeleton from "@/features/payroll-dashboard/components/PayrollWorkspaceSkeleton";
import GeneratePayrollSkeleton from "@/features/payroll/components/generate-payroll/GeneratePayrollSkeleton";
import PayrollApprovalQueueSkeleton from "@/features/payroll/components/PayrollApprovalQueueSkeleton";
import OvertimeApprovalsSkeleton from "@/features/payroll/components/OvertimeApprovalsSkeleton";
import PayrollApprovalsPageSkeleton from "@/features/payroll-reports/components/PayrollApprovalsPageSkeleton";
import PayrollReportsArchiveSkeleton from "@/features/payroll-reports/components/PayrollReportsArchiveSkeleton";
import PayrollAnalyticsPageSkeleton from "@/features/analytics/components/PayrollAnalyticsPageSkeleton";
import AttendanceAnalyticsPageSkeleton from "@/features/analytics/components/AttendanceAnalyticsPageSkeleton";
import AttendanceWorkflowSkeleton from "@/features/attendance/components/AttendanceWorkflowSkeleton";
import OvertimeRequestPageSkeleton from "@/features/overtime-requests/components/OvertimeRequestPageSkeleton";
import PurchaserDashboardSkeleton from "@/features/purchaser-dashboard/components/PurchaserDashboardSkeleton";
import PurchasingPageSkeleton from "@/features/purchasing-approvals/components/PurchasingPageSkeleton";
import GmeaOverviewSkeleton from "@/features/gmea-overview/components/GmeaOverviewSkeleton";
import GmeaProjectsPageSkeleton from "@/features/gmea-projects/components/GmeaProjectsPageSkeleton";
import CeoGmeaProjectsSkeleton from "@/features/gmea-projects/components/CeoGmeaProjectsSkeleton";
import GmeaProjectWorkspaceSkeleton from "@/features/gmea-projects/components/GmeaProjectWorkspaceSkeleton";
import GmeaRentalsSkeleton from "@/features/gmea-rentals/components/GmeaRentalsSkeleton";
import SettingsPageSkeleton from "@/features/settings/components/SettingsPageSkeleton";
import ResetDataSkeleton from "@/features/reset-data/components/ResetDataSkeleton";
import GmeaProjectMetricSkeleton from "@/features/gmea-projects/components/GmeaProjectMetricSkeleton";
import GmeaOverviewDetailsSkeleton from "@/features/gmea-overview/components/GmeaOverviewDetailsSkeleton";

const cases: Array<[string, ReactNode]> = [
  ["hero", <CeoPageHeroSkeleton key="hero" />],
  ["overview", <DashboardOverviewSkeleton key="overview" />],
  ["analytics", <AnalyticsPageSkeleton key="analytics" />],
  ["ceo", <CeoDashboardSkeleton key="ceo" />],
  ["admin", <UserManagementSkeleton key="admin" />],
  ["engineer-dashboard", <EngineerDashboardSkeleton key="engineer-dashboard" />],
  ["engineer-projects", <EngineerProjectsPageSkeleton key="engineer-projects" />],
  ["projects", <ProjectsPageSkeleton key="projects" />],
  ["project-workspace", <ProjectWorkspaceSkeleton key="project-workspace" />],
  ["engineer-project-workspace", <ProjectWorkspaceSkeleton key="engineer-project-workspace" role="engineer" />],
  ["materials-request", <MaterialRequestPageSkeleton key="materials-request" />],
  ["estimator", <CostEstimatorPageSkeleton key="estimator" />],
  ["estimator-projects", <CostEstimatorProjectsOverviewSkeleton key="estimator-projects" />],
  ["estimate-reviews", <EstimateReviewsSectionSkeleton key="estimate-reviews" />],
  ["estimate-table", <EstimateReviewsTableSkeleton key="estimate-table" />],
  ["budget", <BudgetTrackerLoadingState key="budget" />],
  ["payroll-dashboard", <PayrollDashboardSkeleton key="payroll-dashboard" />],
  ["payroll-workspace", <PayrollWorkspaceSkeleton key="payroll-workspace" />],
  ["generate-payroll", <GeneratePayrollSkeleton key="generate-payroll" />],
  ["payroll-queue", <PayrollApprovalQueueSkeleton key="payroll-queue" />],
  ["overtime-approvals", <OvertimeApprovalsSkeleton key="overtime-approvals" />],
  ["payroll-approvals", <PayrollApprovalsPageSkeleton key="payroll-approvals" />],
  ["payroll-reports", <PayrollReportsArchiveSkeleton key="payroll-reports" />],
  ["payroll-analytics", <PayrollAnalyticsPageSkeleton key="payroll-analytics" />],
  ["attendance-analytics", <AttendanceAnalyticsPageSkeleton key="attendance-analytics" />],
  ["upload-attendance", <AttendanceWorkflowSkeleton key="upload-attendance" step={1} />],
  ["review-attendance", <AttendanceWorkflowSkeleton key="review-attendance" step={2} />],
  ["overtime-request", <OvertimeRequestPageSkeleton key="overtime-request" />],
  ["purchaser-dashboard", <PurchaserDashboardSkeleton key="purchaser-dashboard" />],
  ["purchasing", <PurchasingPageSkeleton key="purchasing" />],
  ["gmea-overview", <GmeaOverviewSkeleton key="gmea-overview" />],
  ["gmea-overview-details", <GmeaOverviewDetailsSkeleton key="gmea-overview-details" />],
  ["gmea-metric", <GmeaProjectMetricSkeleton key="gmea-metric" />],
  ["gmea-projects", <GmeaProjectsPageSkeleton key="gmea-projects" />],
  ["ceo-gmea", <CeoGmeaProjectsSkeleton key="ceo-gmea" />],
  ["gmea-project", <GmeaProjectWorkspaceSkeleton key="gmea-project" />],
  ["settings", <SettingsPageSkeleton key="settings" />],
  ["ceo-rentals", <GmeaRentalsSkeleton key="ceo-rentals" canEdit={false} />],
  ["reset", <ResetDataSkeleton key="reset" />],
  ...(["overview", "activities", "progress-updates", "estimates", "materials", "documents", "activity-log", "cost-tracking"] as const)
    .map((tab): [string, ReactNode] => [`project-${tab}`, <ProjectWorkspaceTabSkeleton key={tab} tab={tab} />]),
  ...(["rentals", "dashboard", "reports", "workspace"] as const)
    .map((view): [string, ReactNode] => [`gmea-${view}`, <GmeaRentalsSkeleton key={view} view={view} />]),
  ...(["ceo", "admin", "employee", "payroll_manager", "engineer", "purchaser", "gmea"] as const)
    .map((role): [string, ReactNode] => [`home-${role}`, <HomePageSkeleton key={role} role={role} />]),
];

export default function SkeletonHarness() {
  const selected = new URLSearchParams(window.location.search).get("case");
  return <div data-skeleton-cases="true" className="min-w-0 space-y-8">
    {cases.filter(([name]) => !selected || name === selected).map(([name, content]) => <div key={name} data-skeleton-case={name} className="min-w-0">{content}</div>)}
  </div>;
}

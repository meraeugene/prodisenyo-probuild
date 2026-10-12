"use client";

import Link from "next/link";
import {ArrowLeft} from "lucide-react";
import MaterialApprovalsPageClient from "@/features/material-approvals/components/MaterialApprovalsPageClient";
import ProjectWorkspaceDialogs from "./ProjectWorkspaceDialogs";
import EngineeringProgressWorksheet from "./EngineeringProgressWorksheet";
import EngineerProjectOverview from "./EngineerProjectOverview";
import ProjectProgressUpdatesPanel from "./ProjectProgressUpdatesPanel";
import ProjectMaterialsPanel from "./ProjectMaterialsPanel";
import ProjectDocumentsPanel from "@/features/project-documents/components/ProjectDocumentsPanel";
import ProjectActivityLogPanel from "@/features/project-activity-log/components/ProjectActivityLogPanel";
import ProjectCostTrackingPanel from "@/features/project-cost-tracking/components/ProjectCostTrackingPanel";
import CeoProjectOverview from "./CeoProjectOverview";
import ProjectEstimateReviewSection from "./ProjectEstimateReviewSection";
import ProjectWorkspaceHeader from "./ProjectWorkspaceHeader";
import ProjectWorkspaceTabs from "./ProjectWorkspaceTabs";
import ProjectTabPanel from "./ProjectTabPanel";


import styles from '@/components/workspace/workspace.module.css';
import {useProjectWorkspace} from '../hooks/useProjectWorkspace';
import type {ProjectWorkspaceProps} from '../workspaceTypes';
export default function ProjectWorkspaceClient(props:ProjectWorkspaceProps){
const {project,currentUserId,canUpdateProgress,canReviewEstimates}=props;
const state=useProjectWorkspace(props);
const {tabs,tab,switchTab,isSubmittingProgress,pendingEstimateAction,setReturnEstimateId,setActiveEstimateId,workspaceState,liveActivities,liveEstimates,liveEstimateItems,liveBudgetItems,liveProgressSubmissions,liveMaterialRequests,liveProgressUpdates,liveDocuments,liveProjectExpenses,livePurchaseOrders,liveMaterialReceipts,plannedMaterials,activityRows,submitProgress,approveEstimate}=state;
  return (
    <div className={`${styles.page} space-y-5`}>
      <div className="flex items-center text-xs">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2">
          <ArrowLeft size={15} /> Back to Projects
        </Link>
      </div>
      <ProjectWorkspaceHeader project={project} />
      <ProjectWorkspaceTabs
        tabs={tabs}
        activeTab={tab}
        disabled={false}
        onSelect={switchTab}
      />

      <ProjectTabPanel key={project.id + "-overview"} active={tab === "overview"}>
{canReviewEstimates ? (
          <CeoProjectOverview
            project={project}
            budgetItems={liveBudgetItems}
            progressUpdates={liveProgressUpdates}
          />
        ) : (
          <EngineerProjectOverview
            project={project}
            activities={activityRows}
            budgetItems={liveBudgetItems}
            submissions={liveProgressSubmissions}
            materialRequests={liveMaterialRequests}
            progressUpdates={liveProgressUpdates}
            canUpdateProgress={canUpdateProgress}
            onUpdateProgress={() => switchTab("progress-updates")}
            onOpenMaterials={() => switchTab("materials")}
          />
        )}
      </ProjectTabPanel>


      <ProjectTabPanel key={project.id + "-activities"} active={tab === "activities"}>
<EngineeringProgressWorksheet
          activities={activityRows}
          readOnly={!canUpdateProgress}
          isSubmitting={isSubmittingProgress}
          onSubmitProgress={submitProgress}
        />
      </ProjectTabPanel>

      <ProjectTabPanel key={project.id + "-progress-updates"} active={tab === "progress-updates"}>
<ProjectProgressUpdatesPanel
          projectId={project.id}
          updates={liveProgressUpdates}
          canSubmit={canUpdateProgress}
          onCreated={(update) => {
            void workspaceState.mutate(
              (current) => ({
                activities: current?.activities ?? liveActivities,
                estimates: current?.estimates ?? liveEstimates,
                estimateItems: current?.estimateItems ?? liveEstimateItems,
                budgetItems: current?.budgetItems ?? liveBudgetItems,
                progressSubmissions: current?.progressSubmissions ?? liveProgressSubmissions,
                materialRequests: current?.materialRequests ?? liveMaterialRequests,
                progressUpdates: [update, ...(current?.progressUpdates ?? liveProgressUpdates)],
              }),
              false,
            );
          }}
          onUpdated={(updatedUpdate) => {
            void workspaceState.mutate(
              (current) => ({
                activities: current?.activities ?? liveActivities,
                estimates: current?.estimates ?? liveEstimates,
                estimateItems: current?.estimateItems ?? liveEstimateItems,
                budgetItems: current?.budgetItems ?? liveBudgetItems,
                progressSubmissions: current?.progressSubmissions ?? liveProgressSubmissions,
                materialRequests: current?.materialRequests ?? liveMaterialRequests,
                progressUpdates: (current?.progressUpdates ?? liveProgressUpdates).map((update) =>
                  update.id === updatedUpdate.id ? updatedUpdate : update,
                ),
              }),
              false,
            );
          }}
          onDeleted={(updateId) => {
            void workspaceState.mutate(
              (current) => ({
                activities: current?.activities ?? liveActivities,
                estimates: current?.estimates ?? liveEstimates,
                estimateItems: current?.estimateItems ?? liveEstimateItems,
                budgetItems: current?.budgetItems ?? liveBudgetItems,
                progressSubmissions: current?.progressSubmissions ?? liveProgressSubmissions,
                materialRequests: current?.materialRequests ?? liveMaterialRequests,
                progressUpdates: (current?.progressUpdates ?? liveProgressUpdates).filter(
                  (update) => update.id !== updateId,
                ),
              }),
              false,
            );
          }}
        />
      </ProjectTabPanel>
      <ProjectTabPanel key={project.id + "-estimates"} active={tab === "estimates" && canReviewEstimates}>
<ProjectEstimateReviewSection
          estimates={liveEstimates}
          projectBudget={project.budget}
          pendingAction={pendingEstimateAction}
          onViewDetails={setActiveEstimateId}
          onReturn={setReturnEstimateId}
          onApprove={approveEstimate}
        />
      </ProjectTabPanel>

      <ProjectTabPanel key={project.id + "-materials"} active={tab === "materials"}>
{canReviewEstimates ? (
          <MaterialApprovalsPageClient
            projectName={project.name}
            requestedBy={project.engineer}
            requests={liveMaterialRequests}
            plannedMaterials={plannedMaterials}
            purchaseOrders={livePurchaseOrders}
            canManage
            onReviewed={() => workspaceState.mutate()}
          />
        ) : (
          <ProjectMaterialsPanel
            projectId={project.id}
            requests={liveMaterialRequests}
            plannedMaterials={plannedMaterials}
            purchaseOrders={livePurchaseOrders}
          />
        )}
      </ProjectTabPanel>
      <ProjectTabPanel key={project.id + "-documents"} active={tab === "documents"}>
<ProjectDocumentsPanel
          projectId={project.id}
          documents={liveDocuments}
          canUpload={canUpdateProgress}
          currentUserId={currentUserId}
          onCreated={(document) => {
            void workspaceState.mutate(
              (current) => ({
                activities: current?.activities ?? liveActivities,
                estimates: current?.estimates ?? liveEstimates,
                estimateItems: current?.estimateItems ?? liveEstimateItems,
                budgetItems: current?.budgetItems ?? liveBudgetItems,
                progressSubmissions: current?.progressSubmissions ?? liveProgressSubmissions,
                materialRequests: current?.materialRequests ?? liveMaterialRequests,
                progressUpdates: current?.progressUpdates ?? liveProgressUpdates,
                documents: [document, ...(current?.documents ?? liveDocuments)],
              }),
              false,
            );
          }}
          onDeleted={(documentId) => {
            void workspaceState.mutate(
              (current) => ({
                activities: current?.activities ?? liveActivities,
                estimates: current?.estimates ?? liveEstimates,
                estimateItems: current?.estimateItems ?? liveEstimateItems,
                budgetItems: current?.budgetItems ?? liveBudgetItems,
                progressSubmissions: current?.progressSubmissions ?? liveProgressSubmissions,
                materialRequests: current?.materialRequests ?? liveMaterialRequests,
                progressUpdates: current?.progressUpdates ?? liveProgressUpdates,
                documents: (current?.documents ?? liveDocuments).filter((document) => document.id !== documentId),
              }),
              false,
            );
          }}
        />
      </ProjectTabPanel>
      <ProjectTabPanel key={project.id + "-activity-log"} active={tab === "activity-log"}>
<ProjectActivityLogPanel
          engineerName={project.engineer}
          progressUpdates={liveProgressUpdates}
          progressSubmissions={liveProgressSubmissions}
          materialRequests={liveMaterialRequests}
          documents={liveDocuments}
        />
      </ProjectTabPanel>
      <ProjectTabPanel key={project.id + "-cost-tracking"} active={tab === "cost-tracking"}>
<ProjectCostTrackingPanel
          startingBudget={project.budget}
          materialRequests={liveMaterialRequests}
          purchaseOrders={livePurchaseOrders}
          materialReceipts={liveMaterialReceipts}
          expenses={liveProjectExpenses}
        />
      </ProjectTabPanel>

      <ProjectWorkspaceDialogs state={state}/>
    </div>
  );
}

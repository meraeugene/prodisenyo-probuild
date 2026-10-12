import {useState} from 'react';
import useSWR from 'swr';
import {toast} from 'sonner';
import {rejectProjectEstimateAction} from '@/actions/costEstimator';
import {approveProjectEstimateWithBaselineAction} from '@/actions/estimateProcurement';
import {getProjectWorkspaceDataAction,submitProjectProgressAction} from '@/actions/projects';
import {buildPlannedMaterialRows} from '@/features/material-requests/utils/plannedMaterials';
import {useProjectWorkspaceTabs} from './useProjectWorkspaceTabs';
import type {ImportedProgressActivity} from '../utils/engineeringProgressImport';
import {mapActivity} from '../utils/projectWorkspaceMappers';
import type {WorkspaceData,Estimate,ProjectWorkspaceProps} from '../workspaceTypes';
export function useProjectWorkspace({
  project,
  currentUserId,
  canUpdateProgress,
  canCreateEstimate,
  canReviewEstimates,
  activities,
  estimates,
  estimateItems,
  budgetItems,
  progressSubmissions,
  materialRequests,
  progressUpdates,
  documents,
  projectExpenses,
  purchaseOrders,
  materialReceipts,
}:ProjectWorkspaceProps){
  const { tabs, tab, switchTab } = useProjectWorkspaceTabs(project.id, canReviewEstimates, canCreateEstimate);
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);
  const [pendingEstimateAction, setPendingEstimateAction] = useState<{
    id: string;
    type: "approve" | "return";
  } | null>(null);
  const [returnEstimateId, setReturnEstimateId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [activeEstimateId, setActiveEstimateId] = useState<string | null>(null);
  const workspaceState = useSWR<WorkspaceData>(
    ["project-workspace", project.id],
    async () => getProjectWorkspaceDataAction(project.id) as Promise<WorkspaceData>,
    {
      fallbackData: { activities, estimates, estimateItems, budgetItems, progressSubmissions, materialRequests, progressUpdates, documents, projectExpenses, purchaseOrders, materialReceipts },
      refreshInterval: 4000,
      revalidateOnFocus: true,
    },
  );
  const liveActivities = workspaceState.data?.activities ?? activities;
  const liveEstimates = workspaceState.data?.estimates ?? estimates;
  const liveEstimateItems = workspaceState.data?.estimateItems ?? estimateItems;
  const liveBudgetItems = workspaceState.data?.budgetItems ?? budgetItems;
  const liveProgressSubmissions = workspaceState.data?.progressSubmissions ?? progressSubmissions;
  const liveMaterialRequests = workspaceState.data?.materialRequests ?? materialRequests;
  const liveProgressUpdates = workspaceState.data?.progressUpdates ?? progressUpdates;
  const liveDocuments = workspaceState.data?.documents ?? documents ?? [];
  const liveProjectExpenses = workspaceState.data?.projectExpenses ?? projectExpenses ?? [];
  const livePurchaseOrders = workspaceState.data?.purchaseOrders ?? purchaseOrders ?? [];
  const liveMaterialReceipts = workspaceState.data?.materialReceipts ?? materialReceipts ?? [];
  const plannedMaterials = buildPlannedMaterialRows(
    project.activeApprovedEstimateId,
    liveEstimateItems,
    liveMaterialRequests,
  );

  const activityRows = liveActivities.map((activity) => mapActivity(project.name, activity));
  const activeEstimate =
    liveEstimates.find((estimate) => estimate.id === activeEstimateId) ?? null;
  const activeEstimateItems = activeEstimate
    ? liveEstimateItems.filter((item) => item.estimate_id === activeEstimate.id)
    : [];

  function submitProgress(nextActivities: ImportedProgressActivity[]) {
    if (!canUpdateProgress) return;

    setIsSubmittingProgress(true);
    submitProjectProgressAction({
      projectId: project.id,
      activities: nextActivities,
    })
      .then(async () => {
        await workspaceState.mutate();
        toast.success("Progress submitted to CEO.");
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to submit progress.");
      })
      .finally(() => setIsSubmittingProgress(false));
  }

  function updateLiveEstimate(updatedEstimate: Estimate) {
    void workspaceState.mutate(
      (current) => ({
        activities: current?.activities ?? liveActivities,
        estimateItems: current?.estimateItems ?? liveEstimateItems,
        budgetItems: current?.budgetItems ?? liveBudgetItems,
        progressSubmissions: current?.progressSubmissions ?? liveProgressSubmissions,
        materialRequests: current?.materialRequests ?? liveMaterialRequests,
        progressUpdates: current?.progressUpdates ?? liveProgressUpdates,
        estimates:
          current?.estimates.map((estimate) =>
            estimate.id === updatedEstimate.id ? updatedEstimate : estimate,
          ) ?? liveEstimates,
      }),
      false,
    );
  }

  function approveEstimate(estimateId: string) {
    void (async () => {
      try {
        setPendingEstimateAction({ id: estimateId, type: "approve" });
        const result = await approveProjectEstimateWithBaselineAction(estimateId);
        updateLiveEstimate(result.estimate as Estimate);
        await workspaceState.mutate();
        setActiveEstimateId(null);
        toast.success("Estimate approved and linked to Budget Tracker.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to approve estimate.",
        );
      } finally {
        setPendingEstimateAction(null);
      }
    })();
  }

  function confirmReturnEstimate() {
    if (!returnEstimateId) return;

    void (async () => {
      try {
        setPendingEstimateAction({ id: returnEstimateId, type: "return" });
        const result = await rejectProjectEstimateAction({
          estimateId: returnEstimateId,
          rejectionReason: returnReason,
        });
        updateLiveEstimate(result.estimate as Estimate);
        await workspaceState.mutate();
        setReturnEstimateId(null);
        setActiveEstimateId(null);
        setReturnReason("");
        toast.success("Estimate returned to the engineer.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to return estimate.",
        );
      } finally {
        setPendingEstimateAction(null);
      }
    })();
  }


return {tabs,tab,switchTab,isSubmittingProgress,pendingEstimateAction,returnEstimateId,setReturnEstimateId,returnReason,setReturnReason,activeEstimateId,setActiveEstimateId,workspaceState,liveActivities,liveEstimates,liveEstimateItems,liveBudgetItems,liveProgressSubmissions,liveMaterialRequests,liveProgressUpdates,liveDocuments,liveProjectExpenses,livePurchaseOrders,liveMaterialReceipts,plannedMaterials,activityRows,activeEstimate,activeEstimateItems,submitProgress,approveEstimate,confirmReturnEstimate};
}

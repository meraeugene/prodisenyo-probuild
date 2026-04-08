"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  approveProjectEstimateAction,
  rejectProjectEstimateAction,
} from "@/actions/costEstimator";
import type {
  ProjectEstimateItemRow,
  ProjectEstimateRow,
} from "@/features/cost-estimator/types";
import { buildEstimateItemsMap } from "@/features/cost-estimator/utils/costEstimatorMappers";

interface UseEstimateReviewsPageOptions {
  estimates: ProjectEstimateRow[];
  items: ProjectEstimateItemRow[];
}

function sortReviewEstimates(estimates: ProjectEstimateRow[]) {
  const statusOrder: Record<ProjectEstimateRow["status"], number> = {
    submitted: 0,
    approved: 1,
    rejected: 2,
    draft: 3,
  };

  return [...estimates].sort((left, right) => {
    const statusDiff = statusOrder[left.status] - statusOrder[right.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
  });
}

export function useEstimateReviewsPage({
  estimates: initialEstimates,
  items: initialItems,
}: UseEstimateReviewsPageOptions) {
  const [estimates, setEstimates] = useState(initialEstimates);
  const [itemsByEstimateId] = useState(buildEstimateItemsMap(initialItems));
  const [activeEstimateId, setActiveEstimateId] = useState<string | null>(null);
  const [rejectEstimateId, setRejectEstimateId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [pendingActionType, setPendingActionType] = useState<
    "approve" | "reject" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const sortedEstimates = useMemo(
    () => sortReviewEstimates(estimates),
    [estimates],
  );
  const activeEstimate =
    sortedEstimates.find((estimate) => estimate.id === activeEstimateId) ?? null;
  const activeEstimateItems = activeEstimate
    ? itemsByEstimateId[activeEstimate.id] ?? []
    : [];
  const pendingReviewsCount = useMemo(
    () => estimates.filter((estimate) => estimate.status === "submitted").length,
    [estimates],
  );

  function applyEstimateUpdate(estimate: ProjectEstimateRow) {
    setEstimates((current) =>
      current.map((entry) => (entry.id === estimate.id ? estimate : entry)),
    );
  }

  function handleApproveEstimate(estimateId: string) {
    startTransition(async () => {
      try {
        setPendingActionId(estimateId);
        setPendingActionType("approve");
        const result = await approveProjectEstimateAction(estimateId);
        applyEstimateUpdate(result.estimate);
        toast.success("Estimate approved and linked to Budget Tracker.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to approve estimate.",
        );
      } finally {
        setPendingActionId(null);
        setPendingActionType(null);
      }
    });
  }

  function handleConfirmReject() {
    if (!rejectEstimateId) return;

    startTransition(async () => {
      try {
        setPendingActionId(rejectEstimateId);
        setPendingActionType("reject");
        const result = await rejectProjectEstimateAction({
          estimateId: rejectEstimateId,
          rejectionReason,
        });
        applyEstimateUpdate(result.estimate);
        setRejectEstimateId(null);
        setRejectionReason("");
        toast.success("Estimate rejected.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to reject estimate.",
        );
      } finally {
        setPendingActionId(null);
        setPendingActionType(null);
      }
    });
  }

  return {
    sortedEstimates,
    activeEstimate,
    activeEstimateItems,
    pendingReviewsCount,
    rejectEstimateId,
    rejectionReason,
    setActiveEstimateId,
    setRejectEstimateId,
    setRejectionReason,
    pendingActionId,
    pendingActionType,
    isPending,
    handleApproveEstimate,
    handleConfirmReject,
  };
}

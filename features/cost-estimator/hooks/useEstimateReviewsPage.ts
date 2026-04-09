"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  approveProjectEstimateAction,
  deleteReviewedProjectEstimateAction,
  rejectProjectEstimateAction,
} from "@/actions/costEstimator";
import type {
  ProjectEstimateItemRow,
  ReviewProjectEstimateRow,
} from "@/features/cost-estimator/types";
import { buildEstimateItemsMap } from "@/features/cost-estimator/utils/costEstimatorMappers";

interface UseEstimateReviewsPageOptions {
  estimates: ReviewProjectEstimateRow[];
  items: ProjectEstimateItemRow[];
}

function sortReviewEstimates(estimates: ReviewProjectEstimateRow[]) {
  const statusOrder: Record<ReviewProjectEstimateRow["status"], number> = {
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
  const [itemsByEstimateId, setItemsByEstimateId] = useState(
    buildEstimateItemsMap(initialItems),
  );
  const [activeEstimateId, setActiveEstimateId] = useState<string | null>(null);
  const [deleteEstimateId, setDeleteEstimateId] = useState<string | null>(null);
  const [rejectEstimateId, setRejectEstimateId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [pendingActionType, setPendingActionType] = useState<
    "approve" | "reject" | null
  >(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setEstimates(initialEstimates);
  }, [initialEstimates]);

  useEffect(() => {
    setItemsByEstimateId(buildEstimateItemsMap(initialItems));
  }, [initialItems]);

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

  function applyEstimateUpdate(estimate: ReviewProjectEstimateRow) {
    setEstimates((current) =>
      current.map((entry) => (entry.id === estimate.id ? estimate : entry)),
    );
  }

  function handleConfirmDelete() {
    if (!deleteEstimateId) return;

    void (async () => {
      try {
        setIsPending(true);
        setPendingActionId(deleteEstimateId);
        setPendingActionType(null);
        await deleteReviewedProjectEstimateAction(deleteEstimateId);
        setEstimates((current) =>
          current.filter((entry) => entry.id !== deleteEstimateId),
        );
        setItemsByEstimateId((current) => {
          const { [deleteEstimateId]: _removed, ...rest } = current;
          return rest;
        });
        if (activeEstimateId === deleteEstimateId) {
          setActiveEstimateId(null);
        }
        setDeleteEstimateId(null);
        toast.success("Estimate deleted.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete estimate.",
        );
      } finally {
        setIsPending(false);
        setPendingActionId(null);
      }
    })();
  }

  function handleApproveEstimate(estimateId: string) {
    void (async () => {
      try {
        setIsPending(true);
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
        setIsPending(false);
        setPendingActionId(null);
        setPendingActionType(null);
      }
    })();
  }

  function handleConfirmReject() {
    if (!rejectEstimateId) return;

    void (async () => {
      try {
        setIsPending(true);
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
        setIsPending(false);
        setPendingActionId(null);
        setPendingActionType(null);
      }
    })();
  }

  return {
    sortedEstimates,
    activeEstimate,
    activeEstimateItems,
    pendingReviewsCount,
    deleteEstimateId,
    rejectEstimateId,
    rejectionReason,
    setActiveEstimateId,
    setDeleteEstimateId,
    setRejectEstimateId,
    setRejectionReason,
    pendingActionId,
    pendingActionType,
    isPending,
    handleConfirmDelete,
    handleApproveEstimate,
    handleConfirmReject,
  };
}

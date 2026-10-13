"use client";

import type { Dispatch, SetStateAction, TransitionStartFunction } from "react";
import { toast } from "sonner";
import {
  deleteProjectEstimateAction, reopenRejectedEstimateAction,
  saveProjectEstimateDraftAction, submitProjectEstimateAction,
} from "@/actions/costEstimator";
import { EMPTY_ESTIMATE_FORM, type ProjectEstimateDraftForm, type ProjectEstimateItemRow, type ProjectEstimateRow } from "../types";
import { buildEstimateDraftForm, ensureEstimateLineTotals } from "../utils/costEstimatorMappers";
import { validateSetupForm } from "../utils/estimateSetupValidation";
import { requireSuccessfulEstimateMutation } from "../utils/estimateMutationResult";

type Setter<T> = Dispatch<SetStateAction<T>>;
type SetupErrors = Partial<Record<"projectId" | "projectName" | "projectType" | "location" | "ownerName" | "costEstimate", string>>;

interface EstimateMutationContext {
  estimateForm: ProjectEstimateDraftForm;
  projectSetupOpen: boolean;
  hasUnsavedEstimateChanges: boolean;
  selectedEstimate: ProjectEstimateRow | null;
  sortedEstimates: ProjectEstimateRow[];
  itemsByEstimateId: Record<string, ProjectEstimateItemRow[]>;
  startEstimateTransition: TransitionStartFunction;
  applyEstimateUpdate: (estimate: ProjectEstimateRow, items: ProjectEstimateItemRow[]) => void;
  setSetupFormErrors: Setter<SetupErrors>;
  setSaveState: Setter<"saved" | "dirty" | "saving" | "error">;
  setSaveMessage: Setter<string>;
  setPendingEstimateIntent: Setter<"save" | "submit" | "delete" | "duplicate" | null>;
  setPendingDeleteEstimate: Setter<boolean>;
  setEstimates: Setter<ProjectEstimateRow[]>;
  setItemsByEstimateId: Setter<Record<string, ProjectEstimateItemRow[]>>;
  setSelectedEstimateId: Setter<string | null>;
  setEstimateForm: Setter<ProjectEstimateDraftForm>;
  setProjectSetupOpen: Setter<boolean>;
}

export function useEstimateMutations({
  estimateForm, projectSetupOpen, hasUnsavedEstimateChanges, selectedEstimate, sortedEstimates,
  itemsByEstimateId, startEstimateTransition, applyEstimateUpdate, setSetupFormErrors, setSaveState,
  setSaveMessage, setPendingEstimateIntent, setPendingDeleteEstimate, setEstimates, setItemsByEstimateId,
  setSelectedEstimateId, setEstimateForm, setProjectSetupOpen,
}: EstimateMutationContext) {
  async function persistDraft(shouldSubmit: boolean) {
    const normalizedForm = ensureEstimateLineTotals(estimateForm);
    const nextForm = {
      ...normalizedForm,
      costEstimate: Math.round(100 *
        normalizedForm.items.reduce((sum, item) => sum + item.lineTotal, 0),
      ) / 100,
    };
    const saved = requireSuccessfulEstimateMutation(await saveProjectEstimateDraftAction({
      id: nextForm.id,
      projectId: nextForm.projectId,
      projectName: nextForm.projectName,
      projectType: nextForm.projectType,
      location: nextForm.location,
      ownerName: nextForm.ownerName,
      costEstimate: nextForm.costEstimate,
      notes: nextForm.notes,
      items: nextForm.items.map((item) => ({
        id: item.id,
        catalogItemId: item.catalogItemId,
        materialName: item.materialName,
        unitType: item.unitType,
        unitCost: item.unitCost,
        quantity: item.quantity,
        section: item.section,
        itemNumber: item.itemNumber,
        displayName: item.displayName,
        notes: item.notes,
        pricingBasis: item.pricingBasis,
        referenceSupplier: item.referenceSupplier,
        referenceQuotation: item.referenceQuotation,
        sortOrder: item.sortOrder,
      })),
    }));

    applyEstimateUpdate(saved.estimate, saved.items);

    if (!shouldSubmit) {
      return saved;
    }

    const submitted = await submitProjectEstimateAction(saved.estimate.id);
    applyEstimateUpdate(submitted.estimate, submitted.items);
    toast.success("Estimate submitted for CEO review.");
    return submitted;
  }

  function handleSaveEstimate(onSuccess?: () => void) {
    if (projectSetupOpen) {
      const nextErrors = validateSetupForm(estimateForm);
      if (Object.keys(nextErrors).length > 0) {
        setSetupFormErrors(nextErrors);
        return;
      }
    }

    setPendingEstimateIntent("save");
    setSaveState("saving");
    setSaveMessage("Saving draft...");
    startEstimateTransition(async () => {
      try {
        await persistDraft(false);
        setSetupFormErrors({});
        setSaveState("saved");
        setSaveMessage("Draft saved");
        toast.success(
          projectSetupOpen ? "Project estimate created." : "Draft saved.",
        );
        onSuccess?.();
      } catch (error) {
        setSaveState("error");
        setSaveMessage("Unable to save draft");
        toast.error(
          error instanceof Error ? error.message : "Failed to save estimate.",
        );
      } finally {
        setPendingEstimateIntent(null);
      }
    });
  }

  function handleSubmitEstimate() {
    setPendingEstimateIntent("submit");
    startEstimateTransition(async () => {
      try {
        if (hasUnsavedEstimateChanges) {
          setSaveState("saving");
          setSaveMessage("Saving draft...");
        }
        await persistDraft(true);
        setSaveState("saved");
        setSaveMessage("Draft saved");
      } catch (error) {
        setSaveState("error");
        setSaveMessage("Unable to submit estimate");
        toast.error(
          error instanceof Error ? error.message : "Failed to submit estimate.",
        );
      } finally {
        setPendingEstimateIntent(null);
      }
    });
  }

  function handleDeleteEstimate() {
    if (!selectedEstimate) return;

    setPendingDeleteEstimate(true);
    setPendingEstimateIntent("delete");
    startEstimateTransition(async () => {
      try {
        await deleteProjectEstimateAction(selectedEstimate.id);
        setEstimates((current) =>
          current.filter((estimate) => estimate.id !== selectedEstimate.id),
        );
        setItemsByEstimateId((current) => {
          const { [selectedEstimate.id]: _removed, ...rest } = current;
          return rest;
        });
        const nextEstimate = sortedEstimates.find(
          (estimate) => estimate.id !== selectedEstimate.id,
        );
        if (nextEstimate) {
          setSelectedEstimateId(nextEstimate.id);
          setEstimateForm(
            buildEstimateDraftForm(
              nextEstimate,
              itemsByEstimateId[nextEstimate.id] ?? [],
            ),
          );
          setProjectSetupOpen(false);
        } else {
          setSelectedEstimateId(null);
          setEstimateForm(EMPTY_ESTIMATE_FORM);
          setProjectSetupOpen(true);
        }
        toast.success("Estimate deleted.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete estimate.",
        );
      } finally {
        setPendingDeleteEstimate(false);
        setPendingEstimateIntent(null);
      }
    });
  }

  function handleReopenRejectedEstimate() {
    if (!selectedEstimate) return;

    setPendingEstimateIntent("duplicate");
    startEstimateTransition(async () => {
      try {
        const reopened = requireSuccessfulEstimateMutation(await reopenRejectedEstimateAction(
          selectedEstimate.id,
        ));
        applyEstimateUpdate(reopened.estimate, reopened.items);
        setSaveState("saved");
        setSaveMessage("Draft saved");
        toast.success("Returned estimate reopened for editing.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to reopen estimate.",
        );
      } finally {
        setPendingEstimateIntent(null);
      }
    });
  }


  return { handleSaveEstimate, handleSubmitEstimate, handleDeleteEstimate, handleReopenRejectedEstimate };
}

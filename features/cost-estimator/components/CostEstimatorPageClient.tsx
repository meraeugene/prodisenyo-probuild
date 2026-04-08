"use client";

import { Plus, Save, Send, Trash2 } from "lucide-react";
import DashboardPageHero from "@/components/DashboardPageHero";
import ButtonLoader from "@/features/budget-tracker/components/ButtonLoader";
import CostEstimatorBoard from "@/features/cost-estimator/components/CostEstimatorBoard";
import CostEstimatorItemModal from "@/features/cost-estimator/components/CostEstimatorItemModal";
import CostEstimatorSetupForm from "@/features/cost-estimator/components/CostEstimatorSetupForm";
import CostEstimatorSummaryPanel from "@/features/cost-estimator/components/CostEstimatorSummaryPanel";
import EstimateReportModal from "@/features/cost-estimator/components/EstimateReportModal";
import { useCostEstimatorPage } from "@/features/cost-estimator/hooks/useCostEstimatorPage";
import type {
  CostCatalogItemRow,
  ProjectEstimateItemRow,
  ProjectEstimateRow,
} from "@/features/cost-estimator/types";

export default function CostEstimatorPageClient({
  estimates,
  items,
  catalogItems,
}: {
  estimates: ProjectEstimateRow[];
  items: ProjectEstimateItemRow[];
  catalogItems: CostCatalogItemRow[];
}) {
  const state = useCostEstimatorPage({
    estimates,
    items,
    catalogItems,
  });

  if (state.projectSetupOpen) {
    return (
      <div className="p-6">
        <CostEstimatorSetupForm
          hasExistingProjects={state.sortedEstimates.length > 0}
          form={state.estimateForm}
          pending={state.pendingEstimateAction}
          onBack={state.handleCloseProjectSetup}
          onFieldChange={state.handleEstimateFieldChange}
          onSubmit={state.handleSaveEstimate}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <DashboardPageHero
        eyebrow="Engineer Workspace"
        title="Cost Estimator"
        description="Set up project estimates, add material-based cost lines, and submit completed estimates for CEO review."
      />

      <section className="mt-4 overflow-hidden rounded-[18px] border border-apple-mist bg-white shadow-[0_10px_30px_rgba(24,83,43,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-apple-mist px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={state.selectedEstimate?.id ?? ""}
              onChange={(event) => state.handleSelectEstimate(event.target.value)}
              className="h-11 min-w-[220px] rounded-[10px] border border-apple-mist bg-white px-4 text-sm font-semibold text-apple-charcoal outline-none focus:border-[#1f6a37]"
            >
              {state.sortedEstimates.map((estimate) => (
                <option key={estimate.id} value={estimate.id}>
                  {estimate.project_name || "Untitled estimate"}
                </option>
              ))}
            </select>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              {state.pendingEstimateAction ? "Saving changes..." : "All changes saved"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={state.handleOpenNewProjectSetup}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-apple-mist px-4 text-sm font-semibold text-apple-charcoal transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              New project
            </button>
            {!state.isReadOnlyEstimate ? (
              <button
                type="button"
                onClick={() => state.handleOpenAddCostModal()}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#1f6a37] px-4 text-sm font-semibold text-white transition hover:bg-[#18552d]"
              >
                <Plus size={16} />
                Add cost
              </button>
            ) : null}
            {!state.isReadOnlyEstimate ? (
              <button
                type="button"
                onClick={state.handleDeleteEstimate}
                disabled={state.pendingEstimateAction}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state.pendingDeleteEstimate ? (
                  <ButtonLoader label="Deleting project" />
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete project
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid min-h-[720px] xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-5 px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-apple-charcoal">
                  {state.selectedEstimate?.project_name}
                </h2>
                <p className="mt-2 text-sm text-apple-steel">
                  Build the full estimate breakdown here before sending it to the CEO.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!state.isReadOnlyEstimate ? (
                  <>
                    <button
                      type="button"
                      onClick={state.handleSaveEstimate}
                      disabled={state.pendingEstimateAction}
                      className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-apple-mist px-4 text-sm font-semibold text-apple-charcoal transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save size={15} />
                      Save draft
                    </button>
                    <button
                      type="button"
                      onClick={state.handleSubmitEstimate}
                      disabled={state.pendingEstimateAction}
                      className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#1f6a37] px-4 text-sm font-semibold text-white transition hover:bg-[#18552d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send size={15} />
                      Submit to CEO
                    </button>
                  </>
                ) : state.selectedEstimate?.status === "rejected" ? (
                  <button
                    type="button"
                    onClick={state.handleDuplicateRejectedEstimate}
                    disabled={state.pendingEstimateAction}
                    className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#1f6a37] px-4 text-sm font-semibold text-white transition hover:bg-[#18552d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    New revision
                  </button>
                ) : null}
              </div>
            </div>

            <CostEstimatorBoard
              estimate={state.selectedEstimate}
              form={state.estimateForm}
              readOnly={state.isReadOnlyEstimate}
              onViewItem={state.handleViewItemModal}
              onEditItem={state.handleEditItemModal}
              onDeleteItem={state.handleRemoveItem}
            />
          </div>

          <CostEstimatorSummaryPanel
            estimate={state.selectedEstimate}
            costEstimate={state.currentEstimateTotal}
            itemCount={state.estimateForm.items.length}
            totalQuantity={state.totalQuantity}
          />
        </div>
      </section>

      <CostEstimatorItemModal
        open={state.itemModalOpen}
        form={state.itemModalForm}
        materials={state.materialOptions}
        computedTotal={state.currentLineTotal}
        editing={Boolean(state.itemModalForm.id)}
        readOnly={state.itemModalReadOnly}
        pending={state.pendingEstimateAction}
        onClose={state.handleCloseAddCostModal}
        onSelectMaterial={state.handleSelectMaterial}
        onSelectUnitType={state.handleSelectMaterialUnit}
        onFieldChange={state.handleItemModalFieldChange}
        onMaterialRowFieldChange={state.handleMaterialRowFieldChange}
        onAddMaterial={state.handleAddModalMaterial}
        onSaveMaterial={state.handleSaveModalMaterial}
        onEditMaterial={state.handleEditModalMaterial}
        onRemoveMaterial={state.handleRemoveModalMaterial}
        onSave={state.handleSaveItem}
        onDelete={() => {
          if (state.editingItemIndices && state.editingItemIndices.length > 0) {
            state.handleRemoveItem(state.editingItemIndices);
          }
          state.handleCloseAddCostModal();
        }}
      />

      {state.activeReportEstimate ? (
        <EstimateReportModal
          estimate={state.activeReportEstimate}
          items={state.activeReportItems}
          onClose={() => state.setActiveReportEstimateId(null)}
        />
      ) : null}
    </div>
  );
}

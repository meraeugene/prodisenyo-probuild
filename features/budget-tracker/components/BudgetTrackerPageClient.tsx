"use client";

import BudgetTrackerBoard from "@/features/budget-tracker/components/BudgetTrackerBoard";
import BudgetTrackerDeleteProjectModal from "@/features/budget-tracker/components/BudgetTrackerDeleteProjectModal";
import BudgetTrackerHeader from "@/features/budget-tracker/components/BudgetTrackerHeader";
import BudgetTrackerItemModal from "@/features/budget-tracker/components/BudgetTrackerItemModal";
import BudgetTrackerSetupForm from "@/features/budget-tracker/components/BudgetTrackerSetupForm";
import BudgetTrackerSummaryPanel from "@/features/budget-tracker/components/BudgetTrackerSummaryPanel";
import { useBudgetTrackerPage } from "@/features/budget-tracker/hooks/useBudgetTrackerPage";
import type {
  BudgetItemRow,
  BudgetProjectRow,
} from "@/features/budget-tracker/types";

export default function BudgetTrackerPageClient({
  projects,
  items,
  schemaReady,
  loadError,
}: {
  projects: BudgetProjectRow[];
  items: BudgetItemRow[];
  schemaReady: boolean;
  loadError: string | null;
}) {
  const state = useBudgetTrackerPage({ projects, items, schemaReady });

  return (
    <div>
      {!state.projectSetupOpen ? (
        <BudgetTrackerHeader
          projects={state.localProjects}
          selectedProject={state.selectedProject}
          schemaReady={schemaReady}
          isPending={state.isPending}
          saveState={state.saveState}
          saveMessage={state.saveMessage}
          onSelectProject={state.setSelectedProjectId}
          onNewProject={() => {
            state.resetProjectForm();
            state.setProjectSetupOpen(true);
          }}
          onAddCost={() => state.openNewItemModal()}
          onDeleteProject={() => state.setDeleteProjectModalOpen(true)}
        />
      ) : null}

      {!schemaReady ? (
        <section className="rounded-[12px] border border-amber-200 bg-amber-50/70 p-6 text-amber-900 shadow-sm">
          <p className="text-sm font-semibold">
            Budget tracker tables are not available yet.
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800/90">
            Run the SQL in{" "}
            <span className="font-semibold">
              supabase/budget-tracker-schema.sql
            </span>{" "}
            first, then refresh this page.
          </p>
          {loadError ? (
            <p className="mt-3 text-xs text-amber-700">{loadError}</p>
          ) : null}
        </section>
      ) : null}

      {state.projectSetupOpen ? (
        <BudgetTrackerSetupForm
          projects={state.localProjects}
          projectForm={state.projectForm}
          projectBudgetInput={state.projectBudgetInput}
          projectError={state.projectError}
          isPending={state.isPending}
          pendingAction={state.pendingAction}
          onBack={() => {
            state.setProjectSetupOpen(false);
            state.resetProjectForm();
          }}
          onSubmit={state.submitProject}
          onProjectFormChange={state.setProjectForm}
          onProjectBudgetChange={state.updateFormattedProjectBudget}
        />
      ) : null}

      {state.selectedProject && !state.projectSetupOpen ? (
        <section className="grid min-h-[calc(100vh-69px)]  xl:grid-cols-[minmax(0,1fr)_350px]">
          <BudgetTrackerBoard
            groups={state.groups}
            selectedProject={state.selectedProject}
            draggedItemId={state.draggedItemId}
            activeDropStatus={state.activeDropStatus}
            onAddItem={state.openNewItemModal}
            onDragStart={state.handleDragStart}
            onDragOver={state.handleDragOver}
            onDragEnd={state.handleDragEnd}
            onEditItem={state.openEditItemModal}
          />
          <BudgetTrackerSummaryPanel
            selectedProject={state.selectedProject}
            summary={state.summary}
            budgetHealthMessage={state.budgetHealthMessage}
          />
        </section>
      ) : null}

      <BudgetTrackerItemModal
        open={state.itemModalOpen}
        itemPanelVisible={state.itemPanelVisible}
        itemForm={state.itemForm}
        estimatedCostInput={state.estimatedCostInput}
        actualSpentInput={state.actualSpentInput}
        itemError={state.itemError}
        isPending={state.isPending}
        pendingAction={state.pendingAction}
        onClose={state.closeItemModal}
        onSubmit={state.submitItem}
        onRemove={state.removeItem}
        onItemFormChange={state.setItemForm}
        onEstimatedCostChange={state.updateFormattedEstimatedCost}
        onActualSpentChange={state.updateFormattedActualSpent}
      />

      <BudgetTrackerDeleteProjectModal
        open={state.deleteProjectModalOpen}
        selectedProject={state.selectedProject}
        isPending={state.isPending}
        pendingAction={state.pendingAction}
        onClose={() => state.setDeleteProjectModalOpen(false)}
        onDelete={state.removeProject}
      />
    </div>
  );
}

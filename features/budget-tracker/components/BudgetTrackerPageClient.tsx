"use client";

import { useState } from "react";
import BudgetTrackerBoard from "@/features/budget-tracker/components/BudgetTrackerBoard";
import BudgetTrackerDeleteProjectModal from "@/features/budget-tracker/components/BudgetTrackerDeleteProjectModal";
import BudgetTrackerHeader from "@/features/budget-tracker/components/BudgetTrackerHeader";
import BudgetTrackerItemModal from "@/features/budget-tracker/components/BudgetTrackerItemModal";
import BudgetTrackerProjectsOverview from "@/features/budget-tracker/components/BudgetTrackerProjectsOverview";
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
  const [showProjectOverview, setShowProjectOverview] = useState(
    projects.length > 0 && schemaReady,
  );

  function handleOpenProject(projectId: string) {
    state.setSelectedProjectId(projectId);
    setShowProjectOverview(false);
  }

  function handleCreateProject() {
    state.resetProjectForm();
    state.setProjectSetupOpen(true);
    setShowProjectOverview(false);
  }

  const showOverview =
    schemaReady &&
    showProjectOverview &&
    state.localProjects.length > 0 &&
    !state.projectSetupOpen;

  return (
    <div>
      {showOverview ? (
        <BudgetTrackerProjectsOverview
          projects={state.localProjects}
          items={state.localItems}
          pending={state.isPending}
          onOpenProject={handleOpenProject}
          onCreateProject={handleCreateProject}
        />
      ) : null}

      {!state.projectSetupOpen && !showOverview ? (
        <BudgetTrackerHeader
          projects={state.localProjects}
          selectedProject={state.selectedProject}
          schemaReady={schemaReady}
          isPending={state.isPending}
          saveState={state.saveState}
          saveMessage={state.saveMessage}
          onOpenProjects={() => setShowProjectOverview(true)}
          onSelectProject={state.setSelectedProjectId}
          onNewProject={handleCreateProject}
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

      {state.selectedProject && !state.projectSetupOpen && !showOverview ? (
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
        itemFieldErrors={state.itemFieldErrors}
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

"use client";

import { useState } from "react";
import type { ProjectProgressUpdateRecord } from "../progressUpdateTypes";
import {
  selectLatestProgressUpdate,
  sortProgressUpdatesNewestFirst,
} from "../utils/progressUpdates";
import ProjectProgressUpdateDeleteDialog from "./ProjectProgressUpdateDeleteDialog";
import ProjectProgressUpdateForm from "./ProjectProgressUpdateForm";
import ProjectProgressUpdateList from "./ProjectProgressUpdateList";
import ProjectProgressUpdateModal from "./ProjectProgressUpdateModal";
import ProjectProgressSummary from "./ProjectProgressSummary";

export default function ProjectProgressUpdatesPanel({
  projectId,
  updates,
  canSubmit,
  onCreated,
  onUpdated,
  onDeleted,
  displayMode = "full",
  historyClassName,
}: {
  projectId: string;
  updates: ProjectProgressUpdateRecord[];
  canSubmit: boolean;
  onCreated: (update: ProjectProgressUpdateRecord) => void;
  onUpdated?: (update: ProjectProgressUpdateRecord) => void;
  onDeleted?: (updateId: string) => void;
  displayMode?: "full" | "form" | "history";
  historyClassName?: string;
}) {
  const [isFormOpen, setIsFormOpen] = useState(displayMode === "form");
  const [activeUpdate, setActiveUpdate] = useState<ProjectProgressUpdateRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectProgressUpdateRecord | null>(null);
  const sortedUpdates = sortProgressUpdatesNewestFirst(updates);
  const currentPercent = selectLatestProgressUpdate(sortedUpdates)?.overall_percent ?? 0;

  if (displayMode === "form") {
    return (
      <ProjectProgressUpdateForm
        projectId={projectId}
        initialPercent={currentPercent}
        onCreated={onCreated}
      />
    );
  }

  if (displayMode === "history") {
    return (
      <ProjectProgressUpdateList
        updates={sortedUpdates}
        className={historyClassName}
      />
    );
  }

  return (
    <>
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <ProjectProgressUpdateList
          updates={sortedUpdates}
          canManage={canSubmit}
          onView={setActiveUpdate}
          onDelete={setDeleteTarget}
        />

        <aside className="min-w-0 xl:sticky xl:top-20">
          <ProjectProgressSummary
            updates={sortedUpdates}
            canSubmit={canSubmit}
            isFormOpen={isFormOpen}
            onToggleForm={() => setIsFormOpen((open) => !open)}
          />
        </aside>
      </div>

      {canSubmit && isFormOpen ? (
        <ProjectProgressUpdateModal
          projectId={projectId}
          initialPercent={currentPercent}
          onClose={() => setIsFormOpen(false)}
          onCreated={(update) => {
            onCreated(update);
            setIsFormOpen(false);
          }}
        />
      ) : null}

      {canSubmit && activeUpdate ? (
        <ProjectProgressUpdateModal
          key={activeUpdate.id}
          projectId={projectId}
          initialPercent={activeUpdate.overall_percent}
          update={activeUpdate}
          onClose={() => setActiveUpdate(null)}
          onCreated={(update) => {
            onUpdated?.(update);
            setActiveUpdate(null);
          }}
        />
      ) : null}

      {canSubmit && deleteTarget ? (
        <ProjectProgressUpdateDeleteDialog
          update={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(updateId) => {
            onDeleted?.(updateId);
            setDeleteTarget(null);
          }}
        />
      ) : null}
    </>
  );
}

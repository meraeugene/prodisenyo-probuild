"use client";
import { useState } from "react";
import WorkspaceDialog from "@/components/workspace/WorkspaceDialog";
import type { ProjectProgressUpdateRecord } from "../progressUpdateTypes";
import ProjectProgressUpdateForm from "./ProjectProgressUpdateForm";

export default function ProjectProgressUpdateModal({ projectId, initialPercent, update, onCreated, onClose }: {
  projectId: string; initialPercent: number; update?: ProjectProgressUpdateRecord; onCreated: (update: ProjectProgressUpdateRecord) => void; onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  return <WorkspaceDialog title={update ? "Edit progress update" : "Update project progress"} description="Record overall progress and completed work." size="lg" onClose={onClose} pending={pending}>
    <ProjectProgressUpdateForm projectId={projectId} initialPercent={initialPercent} update={update} compact onCancel={onClose} onCreated={onCreated} onPendingChange={setPending} />
  </WorkspaceDialog>;
}

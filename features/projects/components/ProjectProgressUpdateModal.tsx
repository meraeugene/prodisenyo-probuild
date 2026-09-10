"use client";

import { useEffect } from "react";
import type { ProjectProgressUpdateRecord } from "../progressUpdateTypes";
import ProjectProgressUpdateForm from "./ProjectProgressUpdateForm";

export default function ProjectProgressUpdateModal({
  projectId,
  initialPercent,
  update,
  onCreated,
  onClose,
}: {
  projectId: string;
  initialPercent: number;
  update?: ProjectProgressUpdateRecord;
  onCreated: (update: ProjectProgressUpdateRecord) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[160] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close progress update modal"
        className="absolute inset-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-update-modal-title"
        className="relative z-10 max-h-[94dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl"
      >
        <ProjectProgressUpdateForm
          projectId={projectId}
          initialPercent={initialPercent}
          update={update}
          compact
          modalTitleId="progress-update-modal-title"
          onCancel={onClose}
          onCreated={onCreated}
        />
      </div>
    </div>
  );
}

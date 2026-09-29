"use client";

import { useRef, useState } from "react";
import { DropdownMenu } from "radix-ui";
import { CheckCircle2, Ellipsis, Eye, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { GmeaProject } from "../types";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import GmeaProjectForm from "./GmeaProjectForm";

export default function GmeaProjectActionsMenu({ project, onDetails }: { project: GmeaProject; onDetails: () => void }) {
  const [action, setAction] = useState<"edit" | "status" | "delete" | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const save = useGmeaMutation(project);

  function closeDialog() {
    setAction(null);
    triggerRef.current?.focus();
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label={`Actions for ${project.title}`}
            className="relative z-20 grid h-8 w-8 place-items-center rounded-[9px] border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 data-[state=open]:bg-teal-50 data-[state=open]:text-teal-700"
          >
            <Ellipsis size={17} aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            onCloseAutoFocus={(event) => { if (action) event.preventDefault(); }}
            className="z-[140] min-w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
          >
            <DropdownMenu.Item
              onSelect={onDetails}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 outline-none data-[highlighted]:bg-teal-50 data-[highlighted]:text-teal-800"
            >
              <Eye size={15} aria-hidden="true" /> Details
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => setAction("edit")}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 outline-none data-[highlighted]:bg-teal-50 data-[highlighted]:text-teal-800"
            >
              <Pencil size={15} aria-hidden="true" /> Edit
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => setAction("status")}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 outline-none data-[highlighted]:bg-teal-50 data-[highlighted]:text-teal-800"
            >
              {project.status === "completed"
                ? <><RotateCcw size={15} aria-hidden="true" /> Reopen project</>
                : <><CheckCircle2 size={15} aria-hidden="true" /> Mark as done</>}
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
            <DropdownMenu.Item
              onSelect={() => setAction("delete")}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-700 outline-none data-[highlighted]:bg-rose-50"
            >
              <Trash2 size={15} aria-hidden="true" /> Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {action === "edit" && <GmeaProjectForm project={project} onClose={closeDialog} />}
      {action === "status" && (
        <GmeaDialog
          title={project.status === "completed" ? "Reopen project?" : "Mark project as done?"}
          onClose={closeDialog}
          onSave={() => save({
            kind: "project_status",
            value: { status: project.status === "completed" ? "active" : "completed" },
          }).then(closeDialog)}
          saveLabel={project.status === "completed" ? "Reopen project" : "Mark as done"}
          compact
        >
          <p className="text-sm leading-6 text-slate-600">
            {project.status === "completed"
              ? "Move this project back to the active project list?"
              : "Move this project to Completed? Its financial records and history will remain available."}
          </p>
        </GmeaDialog>
      )}
      {action === "delete" && (
        <GmeaDialog
          title="Delete project?"
          onClose={closeDialog}
          onSave={() => save({ kind: "delete_project" })}
          saveLabel="Delete project"
          compact
          danger
        >
          <p className="text-sm leading-6 text-slate-600">
            Permanently delete <strong className="font-semibold text-slate-900">{project.title}</strong>?
            {" "}This also removes its expenses, payment schedule, receipts, and partner records. This cannot be undone.
          </p>
        </GmeaDialog>
      )}
    </>
  );
}

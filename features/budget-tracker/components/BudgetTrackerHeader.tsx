import {
  CheckCircle2,
  FolderPlus,
  LayoutList,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";
import type { BudgetProjectRow } from "@/features/budget-tracker/types";
import { cn } from "@/lib/utils";

export default function BudgetTrackerHeader({
  projects,
  selectedProject,
  schemaReady,
  isPending,
  saveState,
  saveMessage,
  onOpenProjects,
  onSelectProject,
  onNewProject,
  onAddCost,
  onDeleteProject,
}: {
  projects: BudgetProjectRow[];
  selectedProject: BudgetProjectRow | null;
  schemaReady: boolean;
  isPending: boolean;
  saveState: "saved" | "dirty" | "saving" | "error";
  saveMessage: string;
  onOpenProjects: () => void;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onAddCost: () => void;
  onDeleteProject: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-apple-mist bg-white/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="flex min-h-[48px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {projects.length > 0 ? (
            <button
              type="button"
              onClick={onOpenProjects}
              disabled={isPending}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-apple-mist bg-white px-4 text-sm font-semibold text-apple-charcoal transition hover:bg-apple-mist/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LayoutList size={16} />
              All projects
            </button>
          ) : null}

          {selectedProject ? (
            <select
              value={selectedProject.id}
              onChange={(event) => onSelectProject(event.target.value)}
              className="h-11 min-w-[280px] rounded-[10px] border border-apple-mist bg-white px-4 text-base font-semibold text-apple-charcoal outline-none transition hover:border-[#1f6a37]/60 hover:bg-[#f8fbf9] focus:border-[#1f6a37] focus:bg-[#f8fbf9]"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex h-11 items-center rounded-[10px] border border-apple-mist bg-white px-4 text-sm text-apple-smoke">
              No project selected
            </div>
          )}

          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium",
              saveState === "saving" || saveState === "dirty"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : saveState === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {saveState === "saving" || saveState === "dirty" ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>{saveMessage}</span>
          </div>

          {selectedProject ? (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Draft
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <button
            type="button"
            onClick={onNewProject}
            disabled={!schemaReady || isPending}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-apple-mist bg-white px-4 text-sm font-medium text-apple-charcoal transition hover:bg-apple-mist/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FolderPlus size={16} />
            New project
          </button>
          <button
            type="button"
            onClick={onAddCost}
            disabled={!selectedProject || !schemaReady || isPending}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#1f6a37] px-5 text-sm font-semibold text-white transition hover:bg-[#18552b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} />
            Add cost
          </button>
          {selectedProject ? (
            <button
              type="button"
              onClick={onDeleteProject}
              disabled={isPending}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-rose-200 bg-white px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} />
              Delete project
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

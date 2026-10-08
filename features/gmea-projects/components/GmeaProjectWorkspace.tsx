"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ChartPie, CheckCircle2, Pencil, ReceiptText, RotateCcw, Trash2 } from "lucide-react";
import { getGmeaProjectDataAction } from "@/actions/gmeaProjects";
import type { GmeaExpenseOptions, GmeaProject } from "../types";
import { secondaryClass } from "../utils/gmeaConstants";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaSummaryCards from "./GmeaSummaryCards";
import GmeaProjectForm from "./GmeaProjectForm";
import GmeaExpensesSection from "./GmeaExpensesSection";
import GmeaCollectionsSection from "./GmeaCollectionsSection";
import GmeaProfitSection from "./GmeaProfitSection";
import GmeaConfirmButton from "./GmeaConfirmButton";
import GmeaProjectSidebar from "./GmeaProjectSidebar";
import { contrastTextColor, projectColor } from "../utils/projectAppearance";
import GmeaProjectStatusBadge from "./GmeaProjectStatusBadge";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";
const tabs = [
  { label: "Payment Schedule", icon: CalendarDays },
  { label: "Expenses", icon: ReceiptText },
  { label: "Contract Cost Summary", icon: ChartPie },
] as const;
type WorkspaceTab = (typeof tabs)[number]["label"];
export default function GmeaProjectWorkspace({
  project: initialProject,
  expenseOptions: initialExpenseOptions,
  canEdit,
}: {
  project: GmeaProject;
  expenseOptions: GmeaExpenseOptions;
  canEdit: boolean;
}) {
  const [tab, setTab] = useState<WorkspaceTab>("Payment Schedule"),
    [edit, setEdit] = useState(false);
  const { data } = useSWR(
    ["gmea-project", initialProject.id],
    ([, id]) => getGmeaProjectDataAction(id),
    {
      fallbackData: {
        project: initialProject,
        expenseOptions: initialExpenseOptions,
      },
      revalidateOnFocus: false,
      refreshInterval: canEdit ? 0 : 30000,
    },
  );
  const project = data?.project ?? initialProject;
  const expenseOptions = data?.expenseOptions ?? initialExpenseOptions;
  const save = useGmeaMutation(project);
  return (
    <div className="min-h-full space-y-5 bg-white p-4 sm:p-6 lg:p-8">
      <Link
        href="/gmea-projects"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700"
      >
        <ArrowLeft size={16} />
        GMEA projects
      </Link>
      <header className="workspace-page-header workspace-header-actions flex flex-wrap items-start justify-between gap-5 bg-white pb-2">
        <div className="min-w-0 flex-1 basis-72">
          <div>
            <GmeaProjectStatusBadge status={project.status}  />
          </div>
          <p
            className="mt-2 inline-flex max-w-full rounded-lg px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.12em]"
            style={{
              backgroundColor: projectColor(project),
              color: contrastTextColor(projectColor(project)),
            }}
          >
            {project.title}
          </p>
          <h1 className="mt-2.5 break-words text-[28px] font-semibold leading-none tracking-[-0.045em] sm:text-[32px]">{project.name}</h1>
          <p className="mt-4 flex items-center gap-2 text-sm text-[#53736f]">
            {project.location}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-[#53736f]">
            {project.client || "Client not set"}
          </p>
        </div>
        {canEdit && (
          <div className="flex max-w-full flex-wrap gap-2 text-slate-900">
            <button type="button" className={secondaryClass + " workspace-secondary-action gap-2"} onClick={() => setEdit(true)}>
              <Pencil size={15} aria-hidden="true" /> Edit project
            </button>
            <GmeaConfirmButton
              label={project.status === "completed" ? "Reopen project" : "Mark as done"}
              triggerLabel={project.status === "completed" ? "Reopen project" : "Mark as done"}
              triggerClassName="workspace-secondary-action"
              triggerIcon={project.status === "completed" ? <RotateCcw size={15} aria-hidden="true" /> : <CheckCircle2 size={15} aria-hidden="true" />}
              description={project.status === "completed" ? "Move this project back to the ongoing project list?" : "Move this project to Completed? Its financial records and history will remain available."}
              onConfirm={() => save({ kind: "project_status", value: { status: project.status === "completed" ? "active" : "completed" } })}
            />
            <GmeaConfirmButton
              label="Delete project"
              triggerLabel="Delete project"
              triggerIcon={<Trash2 size={15} aria-hidden="true" />}
              danger
              description="Permanently delete this project and all of its expenses and contract cost records?"
              onConfirm={() => save({ kind: "delete_project" })}
            />
          </div>
        )}
      </header>
      <GmeaSummaryCards project={project} />
      <WorkspaceTabSwitch label="Project sections" items={tabs.map(({ label, icon: Icon }) => ({ value: label, color: projectColor(project),
        label: <span className="inline-flex items-center gap-2"><Icon size={15} aria-hidden="true" />{label}</span> }))} value={tab} onChange={setTab} />
      <div className={tab === "Contract Cost Summary" ? "grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_350px]" : "block"}>
        <div className="min-w-0 rounded-[20px] border border-transparent bg-white p-5 shadow-workspace sm:p-7">
          {tab === "Expenses" && (
            <GmeaExpensesSection project={project} expenseOptions={expenseOptions} canEdit={canEdit} />
          )}
          {tab === "Payment Schedule" && <GmeaCollectionsSection project={project} canEdit={canEdit} />}
          {tab === "Contract Cost Summary" && <GmeaProfitSection project={project} canEdit={canEdit} />}
        </div>
        {tab === "Contract Cost Summary" && <GmeaProjectSidebar project={project} canEdit={canEdit} onEdit={() => setEdit(true)} />}
      </div>
      {edit && (
        <GmeaProjectForm project={project} onClose={() => setEdit(false)} />
      )}
    </div>
  );
}

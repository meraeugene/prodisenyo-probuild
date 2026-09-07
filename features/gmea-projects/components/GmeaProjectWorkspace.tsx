"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import type { GmeaExpenseOptions, GmeaProject } from "../types";
import { secondaryClass } from "../utils/gmeaConstants";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaSummaryCards from "./GmeaSummaryCards";
import GmeaProjectOverview from "./GmeaProjectOverview";
import GmeaProjectForm from "./GmeaProjectForm";
import GmeaExpensesSection from "./GmeaExpensesSection";
import GmeaProfitSection from "./GmeaProfitSection";
import GmeaConfirmButton from "./GmeaConfirmButton";
const tabs = ["Overview", "Expenses", "Contract Cost Summary"] as const;
export default function GmeaProjectWorkspace({
  project,
  expenseOptions,
  canEdit,
}: {
  project: GmeaProject;
  expenseOptions: GmeaExpenseOptions;
  canEdit: boolean;
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview"),
    [edit, setEdit] = useState(false);
  const save = useGmeaMutation(project),
    financialEdit = canEdit && project.status !== "archived";
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href="/gmea-projects"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-700"
      >
        <ArrowLeft size={16} />
        GMEA projects
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            GMEA Marketing Corporation
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {project.name}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={14} />
            {project.location}
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize">
              {project.status.replace("_", " ")}
            </span>
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button className={secondaryClass} onClick={() => setEdit(true)}>
              Edit project
            </button>
            {project.status !== "archived" && (
              <GmeaConfirmButton
                label="Archive project"
                description="Keep this project and its history, but stop financial edits. You can restore it by editing its status."
                onConfirm={() =>
                  save({
                    kind: "project",
                    value: { ...project, status: "archived" },
                  })
                }
              />
            )}
            {project.status === "archived" && (
              <GmeaConfirmButton
                label="Restore project"
                description="Restore this project so expenses can be edited again."
                onConfirm={() =>
                  save({
                    kind: "project",
                    value: { ...project, status: "active" },
                  })
                }
              />
            )}
          </div>
        )}
      </header>
      <GmeaSummaryCards project={project} />
      {project.status === "archived" && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          This project is archived. Its financial history remains available.
        </p>
      )}
      <nav
        aria-label="Project sections"
        className="flex gap-2 overflow-x-auto border-b border-slate-200"
      >
        {tabs.map((t) => (
          <button
            key={t}
            aria-current={tab === t ? "page" : undefined}
            onClick={() => setTab(t)}
            className={
              "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium " +
              (tab === t
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-900")
            }
          >
            {t}
          </button>
        ))}
      </nav>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        {tab === "Overview" && <GmeaProjectOverview project={project} />}
        {tab === "Expenses" && (
          <GmeaExpensesSection
            project={project}
            expenseOptions={expenseOptions}
            canEdit={financialEdit}
          />
        )}
        {tab === "Contract Cost Summary" && (
          <GmeaProfitSection project={project} canEdit={financialEdit} />
        )}
      </div>
      {edit && (
        <GmeaProjectForm project={project} onClose={() => setEdit(false)} />
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ArrowLeft, MapPin, UserRound } from "lucide-react";
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
const tabs = ["Payment Schedule", "Expenses", "Contract Cost Summary"] as const;
export default function GmeaProjectWorkspace({
  project: initialProject,
  expenseOptions: initialExpenseOptions,
  canEdit,
}: {
  project: GmeaProject;
  expenseOptions: GmeaExpenseOptions;
  canEdit: boolean;
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Payment Schedule"),
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
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href="/gmea-projects"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700"
      >
        <ArrowLeft size={16} />
        GMEA projects
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
            GMEA Marketing Corporation
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {project.name}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={14} />
            {project.location}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <UserRound size={14} aria-hidden="true" />
            {project.client || "Client not set"}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button className={secondaryClass} onClick={() => setEdit(true)}>
              Edit project
            </button>
            <GmeaConfirmButton
              label="Delete project"
              danger
              description="Permanently delete this project and all of its expenses and contract cost records?"
              onConfirm={() => save({ kind: "delete_project" })}
            />
          </div>
        )}
      </header>
      <GmeaSummaryCards project={project} />
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
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-900")
            }
          >
            {t}
          </button>
        ))}
      </nav>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        {tab === "Expenses" && (
          <GmeaExpensesSection
            project={project}
            expenseOptions={expenseOptions}
            canEdit={canEdit}
          />
        )}
        {tab === "Payment Schedule" && (
          <GmeaCollectionsSection project={project} canEdit={canEdit} />
        )}
        {tab === "Contract Cost Summary" && (
          <GmeaProfitSection project={project} canEdit={canEdit} />
        )}
      </div>
      {edit && (
        <GmeaProjectForm project={project} onClose={() => setEdit(false)} />
      )}
    </div>
  );
}

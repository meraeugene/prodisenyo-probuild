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
    <div className="min-h-full space-y-7 bg-[#f6f8f8] p-4 sm:p-6 lg:p-8">
      <Link
        href="/gmea-projects"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700"
      >
        <ArrowLeft size={16} />
        GMEA projects
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-[#075e5b] p-6 text-white sm:p-8">
        <div className="min-w-0 flex-1 basis-72">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">
            GMEA Marketing Corporation
          </p>
          <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight sm:text-4xl">
            {project.name}
          </h1>
          <p className="mt-4 flex items-center gap-2 text-sm text-teal-50/80">
            <MapPin size={14} className="shrink-0" aria-hidden="true" />
            {project.location}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-teal-50/80">
            <UserRound size={14} aria-hidden="true" />
            {project.client || "Client not set"}
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 text-slate-900">
            <button className={secondaryClass + " border-transparent bg-slate-50 text-[#076d69]"} onClick={() => setEdit(true)}>
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
        className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5"
      >
        {tabs.map((t) => (
          <button
            key={t}
            aria-current={tab === t ? "page" : undefined}
            onClick={() => setTab(t)}
            className={
              "whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 " +
              (tab === t
                ? "bg-[#076d69] text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
            }
          >
            {t}
          </button>
        ))}
      </nav>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_-25px_rgba(15,23,42,.25)] sm:p-7">
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

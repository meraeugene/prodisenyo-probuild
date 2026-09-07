"use client";
import { useState } from "react";
import Link from "next/link";
import { FolderKanban, Plus, MapPin } from "lucide-react";
import type { GmeaProject } from "../types";
import {
  PROJECT_STATUSES,
  buttonClass,
  inputClass,
  secondaryClass,
} from "../utils/gmeaConstants";
import {
  formatMoney,
  projectSummary,
  sumMoney,
} from "../utils/gmeaCalculations";
import GmeaProjectForm from "./GmeaProjectForm";
import GmeaDialog from "./GmeaDialog";
import GmeaProjectOverview from "./GmeaProjectOverview";

export default function GmeaProjectsPageClient({
  projects,
  canEdit,
}: {
  projects: GmeaProject[];
  canEdit: boolean;
}) {
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("current");
  const [create, setCreate] = useState(false),
    [details, setDetails] = useState<GmeaProject | null>(null);
  const visible = projects.filter(
    (p) =>
      (status === "all" ||
        (status === "current"
          ? p.status !== "archived"
          : p.status === status)) &&
      [p.name, p.client, p.location]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const summaries = visible.map(projectSummary);
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            GMEA Marketing Corporation
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Project monitoring
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {canEdit
              ? "Manage quotations, collections, and project costs."
              : "View GMEA projects, quotations, and financial summaries."}
          </p>
        </div>
        {canEdit && (
          <button className={buttonClass} onClick={() => setCreate(true)}>
            <Plus size={17} />
            New project
          </button>
        )}
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Projects", String(visible.length)],
          [
            "Contract value",
            formatMoney(sumMoney(summaries.map((s) => s.contract ?? 0))),
          ],
          [
            "Total expenses",
            formatMoney(sumMoney(summaries.map((s) => s.expenses))),
          ],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          aria-label="Search projects"
          className={inputClass + " sm:max-w-md"}
          placeholder="Search project, client, or location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter project status"
          className={inputClass + " sm:max-w-48"}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="current">Current projects</option>
          <option value="all">All statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      {!visible.length && (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <FolderKanban className="mx-auto text-slate-400" size={32} />
          <h2 className="mt-4 font-semibold">No projects found</h2>
          <p className="mt-1 text-sm text-slate-500">
            {projects.length
              ? "Try a different search or status."
              : "Your GMEA workspace is ready for its first project."}
          </p>
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((p) => {
          const s = projectSummary(p);
          return (
            <article
              key={p.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <FolderKanban size={22} className="text-emerald-700" />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-600">
                  {p.status.replace("_", " ")}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
                {p.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {p.client || "Client not set"}
              </p>
              <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={13} />
                {p.location}
              </p>
              <div className="my-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Contract</p>
                  <p className="mt-1 font-semibold">
                    {formatMoney(s.contract)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Expenses</p>
                  <p className="mt-1 font-semibold">
                    {formatMoney(s.expenses)}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link className={buttonClass} href={"/gmea-projects/" + p.id}>
                  Open project
                </Link>
                <button
                  className={secondaryClass}
                  onClick={() => setDetails(p)}
                >
                  Details
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {create && <GmeaProjectForm onClose={() => setCreate(false)} />}
      {details && (
        <GmeaDialog title={details.name} onClose={() => setDetails(null)}>
          <GmeaProjectOverview project={details} />
        </GmeaDialog>
      )}
    </div>
  );
}

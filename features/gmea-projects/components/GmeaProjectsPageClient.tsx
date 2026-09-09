"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ArrowUpRight, FolderKanban, Plus, MapPin, Search, UserRound, WalletCards, ReceiptText } from "lucide-react";
import { getGmeaProjectsDataAction } from "@/actions/gmeaProjects";
import type { GmeaProject } from "../types";
import { inputClass } from "../utils/gmeaConstants";
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
  const { data: liveProjects = projects } = useSWR(
    "gmea-projects:list",
    getGmeaProjectsDataAction,
    {
      fallbackData: projects,
      revalidateOnFocus: false,
      refreshInterval: canEdit ? 0 : 30000,
    },
  );
  const [query, setQuery] = useState("");
  const [create, setCreate] = useState(false),
    [details, setDetails] = useState<GmeaProject | null>(null);
  const visible = liveProjects.filter(
    (p) =>
      [p.name, p.client, p.location]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const summaries = visible.map(projectSummary);
  return (
    <div className="min-h-full space-y-7 bg-[#f6f8f8] p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-[#075e5b] p-6 text-white sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">
            GMEA Marketing Corporation
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Project portfolio
          </h1>
          <p className="mt-3 text-sm text-teal-50/80">
            Your projects. Every contract, every cost.
          </p>
        </div>
        {canEdit && (
          <button className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#076d69] hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-white" onClick={() => setCreate(true)}>
            <Plus size={17} />
            New project
          </button>
        )}
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Projects", String(visible.length)],
          [
            "Contract amount",
            formatMoney(sumMoney(summaries.map((s) => s.contract))),
          ],
          [
            "Total expenses",
            formatMoney(sumMoney(summaries.map((s) => s.expenses))),
          ],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_24px_-20px_rgba(15,23,42,.25)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <span className={"grid h-9 w-9 shrink-0 place-items-center rounded-xl " + (label === "Projects" ? "bg-teal-50 text-teal-700" : label === "Contract amount" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700")}>
                {label === "Projects" ? <FolderKanban size={18} /> : label === "Contract amount" ? <WalletCards size={18} /> : <ReceiptText size={18} />}
              </span>
            </div>
            <p className="mt-4 break-words text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">{query ? "Search results" : "All projects"}</h2>
          <p className="mt-1 text-xs text-slate-500">{visible.length} projects{query ? " matching your search" : " in your portfolio"}</p>
        </div>
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">Search projects</span>
          <Search
            aria-hidden="true"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        <input
          aria-label="Search projects"
          className={inputClass + " pl-10"}
          placeholder="Search project, client, or location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        </label>
      </div>
      {!visible.length && (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <FolderKanban className="mx-auto text-slate-400" size={32} />
          <h2 className="mt-4 font-semibold">No projects found</h2>
          <p className="mt-1 text-sm text-slate-500">
            {liveProjects.length
              ? "Try a different search."
              : "Your GMEA workspace is ready for its first project."}
          </p>
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {visible.map((p) => {
          const s = projectSummary(p);
          return (
            <article
              key={p.id}
              className="group relative isolate flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_-25px_rgba(15,23,42,.25)] transition-shadow hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,.35)]"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-[#076d69]"><FolderKanban size={21} aria-hidden="true" /></span>
                {!canEdit && p.expenses.some((expense) => expense.is_new) && (
                  <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-800">
                    New expense
                  </span>
                )}
              </div>
              <h2 className="mt-5 break-words text-xl font-semibold tracking-tight text-slate-950">
                {p.name}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <UserRound size={14} aria-hidden="true" />
                {p.client || "Client not set"}
              </p>
              <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={13} />
                {p.location}
              </p>
              <div className="my-6 grid gap-4 border-t border-slate-100 pt-5 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Contract amount</p>
                  <p className="mt-1 break-words text-2xl font-semibold tracking-tight tabular-nums">
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
              <div className="-mx-6 -mb-6 mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                <Link
                  aria-label={`Open project: ${p.name}`}
                  className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[#076d69] group-hover:text-teal-950 after:absolute after:inset-0 after:z-10 after:cursor-pointer after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-teal-700"
                  href={"/gmea-projects/" + p.id}
                >
                  Open project <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <button
                  className="relative z-20 rounded-md text-sm font-medium text-slate-600 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-teal-700"
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

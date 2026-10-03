"use client";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { LoaderCircle, X } from "lucide-react";
import Field from "./ProjectFormField";
import ProjectImageField from "./ProjectImageField";
import { formatBudgetInput } from "../utils/projectForm";
import type { useCreateProject } from "../hooks/useCreateProject";
import type { EngineerOption } from "../types";
export default function CreateProjectModal({ form, engineers }: { form: ReturnType<typeof useCreateProject>; engineers: EngineerOption[] }) {
 const { showCreate, submit, closeCreateModal, formErrors, clearFieldError, budgetValue, setBudgetValue, pending } = form;
 const dialogRef = useRef<HTMLFormElement>(null);
 useEffect(() => {
   if (!showCreate) return;
   const previousFocus = document.activeElement as HTMLElement | null;
   const dialog = dialogRef.current;
   dialog?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
   const trapFocus = (event: KeyboardEvent) => {
     if (event.key !== "Tab" || !dialog) return;
     const elements = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input, select'));
     const first = elements[0], last = elements[elements.length - 1];
     if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
     if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
   };
   document.addEventListener("keydown", trapFocus);
   return () => { document.removeEventListener("keydown", trapFocus); previousFocus?.focus(); };
 }, [showCreate]);
 if (!showCreate || typeof document === "undefined") return null;
 return createPortal(<div
              className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-start justify-center overflow-y-auto overscroll-contain bg-[#153b37]/15 backdrop-blur-[2px] px-4 py-4 sm:px-6"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeCreateModal();
              }}
            >
              <form
                ref={dialogRef}
                action={submit}
                noValidate
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-project-title"
                className="my-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(24,55,52,0.08)]"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-xs font-medium text-teal-700">
                      Construction workflow
                    </p>
                    <h2 id="create-project-title" className="mt-1 text-xl font-semibold text-slate-950">
                      Create project
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                    aria-label="Close create project form"
                  >
                    <X size={21} />
                  </button>
                </div>

                <div className="grid gap-x-5 gap-y-3 px-5 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
                  <Field name="name" label="Project name" error={formErrors.name} onChange={() => clearFieldError("name")} />
                  <Field name="location" label="Location" error={formErrors.location} onChange={() => clearFieldError("location")} />
                  <Field name="subject" label="Subject" error={formErrors.subject} onChange={() => clearFieldError("subject")} />
                  <label className="text-sm font-semibold text-slate-700">
                    Project lead
                    <select
                      name="lead"
                      aria-invalid={Boolean(formErrors.lead)}
                      onChange={() => clearFieldError("lead")}
                      className={`mt-1 h-11 w-full rounded-xl border bg-white px-3 font-normal outline-none transition ${formErrors.lead ? "border-red-500 focus:border-red-600" : "border-slate-200 focus:border-teal-700"}`}
                    >
                      <option value="">Select project lead</option>
                      {engineers.map((engineer) => (
                        <option key={engineer.id} value={engineer.name}>
                          {engineer.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.lead ? (
                      <span className="mt-1 block text-xs font-medium text-red-600">
                        {formErrors.lead}
                      </span>
                    ) : null}
                  </label>
                  <ProjectImageField form={form} />
                  <label className="text-sm font-semibold text-slate-700">
                    Cost estimate engineer / project manager
                    <select
                      name="estimateEngineerId"
                      aria-invalid={Boolean(formErrors.estimateEngineerId)}
                      onChange={() => clearFieldError("estimateEngineerId")}
                      className={`mt-1 h-11 w-full rounded-xl border bg-white px-3 outline-none transition ${
                        formErrors.estimateEngineerId
                          ? "border-red-500 focus:border-red-600"
                          : "border-slate-200 focus:border-teal-700"
                      }`}
                    >
                      <option value="">Select estimate engineer</option>
                      {engineers.map((engineer) => (
                        <option key={engineer.id} value={engineer.id}>
                          {engineer.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.estimateEngineerId ? (
                      <span className="mt-1 block text-xs font-medium text-red-600">
                        {formErrors.estimateEngineerId}
                      </span>
                    ) : null}
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Budget ceiling (PHP)
                    <input
                      name="budgetDisplay"
                      type="text"
                      inputMode="decimal"
                      value={budgetValue}
                      aria-invalid={Boolean(formErrors.budget)}
                      onChange={(event) => {
                        setBudgetValue(formatBudgetInput(event.target.value));
                        clearFieldError("budget");
                      }}
                      placeholder="0.00"
                      className={`mt-1 h-11 w-full rounded-xl border px-3 font-normal outline-none ${
                        formErrors.budget
                          ? "border-red-500 focus:border-red-600"
                          : "border-slate-200 focus:border-teal-700"
                      }`}
                    />
                    {formErrors.budget ? (
                      <span className="mt-1 block text-xs font-medium text-red-600">
                        {formErrors.budget}
                      </span>
                    ) : null}
                  </label>
                  <Field name="startDate" label="Start date" type="date" error={formErrors.startDate} onChange={() => clearFieldError("startDate")} />
                  <Field name="endDate" label="End date" type="date" error={formErrors.endDate} onChange={() => clearFieldError("endDate")} />
                </div>

                <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={pending}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 text-sm font-semibold text-white shadow-workspace-button hover:bg-teal-900 disabled:opacity-60"
                  >
                    {pending ? <LoaderCircle className="animate-spin" size={16} /> : null}
                    Create project
                  </button>
                </div>
              </form>
            </div>, document.body);
}

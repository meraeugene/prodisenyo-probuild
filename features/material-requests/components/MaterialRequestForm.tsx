"use client";
import {LoaderCircle,Send} from 'lucide-react';
import styles from '@/components/workspace/workspace.module.css';
import {inputClass} from '../utils/materialRequestPresentation';
import {PRIORITY_OPTIONS} from '../utils/materialRequestForm';
import type {MaterialRequestPriority} from '../types';
import type {MaterialRequestPageProps,useMaterialRequestPage} from '../hooks/useMaterialRequestPage';
export default function MaterialRequestForm({state,projects,plannedMaterial}:{state:ReturnType<typeof useMaterialRequestPage>;projects:MaterialRequestPageProps['projects'];plannedMaterial:MaterialRequestPageProps['plannedMaterial']}){
const {form,formErrors,isPending,updateField,handleSubmit}=state;
return <section className={styles.panel}><div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>New material request</h2><p className={styles.sectionDescription}>Specify the material, quantity, and delivery requirements.</p></div></div><div className="p-5">          {plannedMaterial ? (
            <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                Approved estimate material
              </p>
              <p className="mt-2 font-semibold text-teal-950">
                {plannedMaterial.materialName}
              </p>
              <p className="mt-1 text-sm text-teal-800">
                {plannedMaterial.remainingQuantity} {plannedMaterial.unit} remaining of{" "}
                {plannedMaterial.plannedQuantity} planned
              </p>
            </div>
          ) : null}

          <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-[13px] font-medium text-apple-charcoal">
                Project Name <span className="text-rose-500">*</span>
              </span>
              <select disabled={Boolean(plannedMaterial)} value={form.projectId} onChange={(event) => { const selected = projects.find((project) => project.id === event.target.value); updateField("projectId", event.target.value); updateField("projectName", selected?.name ?? ""); }} className={inputClass(Boolean(formErrors.projectId))}>
                <option value="">Select an assigned project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              {formErrors.projectId ? (
                <p className="text-xs font-medium text-rose-600">
                  {formErrors.projectId}
                </p>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-[13px] font-medium text-apple-charcoal">
                Material Name <span className="text-rose-500">*</span>
              </span>
              <input
                value={form.materialName}
                onChange={(event) =>
                  updateField("materialName", event.target.value)
                }
                placeholder="2x3 steel tubing"
                readOnly={Boolean(plannedMaterial)}
                className={inputClass(Boolean(formErrors.materialName))}
              />
              {formErrors.materialName ? (
                <p className="text-xs font-medium text-rose-600">
                  {formErrors.materialName}
                </p>
              ) : null}
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-[13px] font-medium text-apple-charcoal">
                  Quantity <span className="text-rose-500">*</span>
                </span>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  max={plannedMaterial?.remainingQuantity}
                  value={form.quantity}
                  onChange={(event) =>
                    updateField("quantity", Number(event.target.value || 0))
                  }
                  className={inputClass(Boolean(formErrors.quantity))}
                />
                {formErrors.quantity ? (
                  <p className="text-xs font-medium text-rose-600">
                    {formErrors.quantity}
                  </p>
                ) : null}
              </label>

              <label className="grid gap-2">
                <span className="text-[13px] font-medium text-apple-charcoal">
                  Unit <span className="text-rose-500">*</span>
                </span>
                <input
                  value={form.unit}
                  onChange={(event) => updateField("unit", event.target.value)}
                  placeholder="pcs"
                  readOnly={Boolean(plannedMaterial)}
                  className={inputClass(Boolean(formErrors.unit))}
                />
                {formErrors.unit ? (
                  <p className="text-xs font-medium text-rose-600">
                    {formErrors.unit}
                  </p>
                ) : null}
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-[13px] font-medium text-apple-charcoal">
                  Needed By <span className="text-rose-500">*</span>
                </span>
                <input
                  type="date"
                  value={form.neededBy}
                  onChange={(event) =>
                    updateField("neededBy", event.target.value)
                  }
                  className={inputClass(Boolean(formErrors.neededBy))}
                />
                {formErrors.neededBy ? (
                  <p className="text-xs font-medium text-rose-600">
                    {formErrors.neededBy}
                  </p>
                ) : null}
              </label>

              <label className="grid gap-2">
                <span className="text-[13px] font-medium text-apple-charcoal">
                  Priority <span className="text-rose-500">*</span>
                </span>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    updateField(
                      "priority",
                      event.target.value as MaterialRequestPriority,
                    )
                  }
                  className={inputClass(Boolean(formErrors.priority))}
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formErrors.priority ? (
                  <p className="text-xs font-medium text-rose-600">
                    {formErrors.priority}
                  </p>
                ) : null}
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-[13px] font-medium text-apple-charcoal">
                Site (Optional)
              </span>
              <input
                value={form.site ?? ""}
                onChange={(event) => updateField("site", event.target.value)}
                placeholder="Site A - Main Building"
                className="h-9 rounded-[5px] border border-apple-mist px-3 text-sm text-apple-charcoal outline-none transition focus:border-[#076d69]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[13px] font-medium text-apple-charcoal">
                Notes (Optional)
              </span>
              <textarea
                rows={4}
                value={form.notes ?? ""}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Include specs, brand preference, or usage details."
                className={`rounded-[5px] border px-3 py-3 text-sm text-apple-charcoal outline-none transition focus:border-[#076d69] ${
                  formErrors.notes
                    ? "border-rose-300 bg-rose-50/40"
                    : "border-apple-mist bg-white"
                }`}
              />
              {formErrors.notes ? (
                <p className="text-xs font-medium text-rose-600">
                  {formErrors.notes}
                </p>
              ) : null}
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-9 w-fit items-center gap-2 rounded-[10px] bg-[#076d69] px-5 text-[13px] font-medium text-white transition hover:bg-[#18552b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Submit request
                </>
              )}
            </button>
          </form></div></section>;
}

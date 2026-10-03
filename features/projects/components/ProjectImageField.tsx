import Image from "next/image";
import { Trash2, UploadCloud } from "lucide-react";
import type { useCreateProject } from "../hooks/useCreateProject";
export default function ProjectImageField({ form }: { form: ReturnType<typeof useCreateProject> }) {
 const { formErrors, imageInputRef, handleProjectImage, imagePreviewUrl, clearProjectImage } = form;
 return (<div>
                    <p className="text-sm font-semibold text-slate-700">
                      Project image <span className="font-normal text-slate-400">(optional)</span>
                    </p>
                    <label className={`relative mt-1 flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed transition ${formErrors.image ? "border-red-500 bg-red-50/30" : "border-slate-300 bg-slate-50/50 hover:border-teal-500 hover:bg-teal-50/30"}`}>
                      <input
                        ref={imageInputRef}
                        name="projectImage"
                        aria-label="Project image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) =>
                          handleProjectImage(event.target.files?.[0])
                        }
                      />
                      {imagePreviewUrl ? (
                        <>
                          <Image
                            src={imagePreviewUrl}
                            alt="Selected project preview"
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-slate-950/65 px-3 py-2 text-center text-xs font-semibold text-white">
                            Click to replace image
                          </span>
                        </>
                      ) : (
                        <span className="flex flex-col items-center gap-2 px-4 text-center">
                          <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-700">
                            <UploadCloud size={18} />
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            Upload project image
                          </span>
                          <span className="text-[11px] text-slate-400">
                            JPG, PNG or WebP · Max 5 MB
                          </span>
                        </span>
                      )}
                    </label>
                    <div className="mt-1 flex min-h-5 items-center justify-between gap-3">
                      {formErrors.image ? (
                        <span className="text-xs font-medium text-red-600">
                          {formErrors.image}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          You can add this later.
                        </span>
                      )}
                      {imagePreviewUrl ? (
                        <button
                          type="button"
                          onClick={clearProjectImage}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>);
}

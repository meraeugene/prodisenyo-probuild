"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle, Loader2 } from "lucide-react";
import type { Employee } from "@/app/types";
import { parseAttendanceFile } from "@/app/lib/parser";

interface UploadZoneProps {
  onParsed: (employees: Employee[], period: string) => void;
}

export default function UploadZone({ onParsed }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function isAcceptedFile(target: File): boolean {
    const ext = target.name.split(".").pop()?.toLowerCase();
    return ext === "xls" || ext === "xlsx" || ext === "csv";
  }

  async function processFiles(targetFiles: File[]) {
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        targetFiles.map((file) => parseAttendanceFile(file)),
      );

      const allEmployees = results.flatMap((r) => r.employees);

      const period =
        results.find((r) => r.period !== "Current Period")?.period ??
        "Current Period";

      if (allEmployees.length === 0) {
        throw new Error(
          "No employee records found. Try exporting as XLS, XLSX, or CSV.",
        );
      }

      onParsed(allEmployees, period);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse files.");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);

    const dropped = Array.from(e.dataTransfer.files);

    const valid = dropped.filter(isAcceptedFile);

    if (valid.length === 0) {
      setError("Only XLS, XLSX, and CSV files are supported.");
      return;
    }

    setFiles(valid);
    processFiles(valid);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);

    const valid = selected.filter(isAcceptedFile);

    if (valid.length === 0) {
      setError("Only XLS, XLSX, and CSV files are supported.");
      return;
    }

    setFiles(valid);
    processFiles(valid);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => files.length === 0 && inputRef.current?.click()}
        className={`relative rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer
        ${
          dragging
            ? "border-apple-charcoal bg-apple-charcoal/5 scale-[1.01]"
            : files.length > 0
              ? "border-apple-silver bg-white cursor-default"
              : "border-apple-silver hover:border-apple-ash hover:bg-white/60 bg-white/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xls,.xlsx,.csv"
          multiple
          onChange={handleChange}
          className="hidden"
        />

        {files.length === 0 ? (
          <div className="py-16 px-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-apple-charcoal/5 flex items-center justify-center mb-5">
              <Upload size={28} className="text-apple-charcoal" />
            </div>

            <p className="text-[17px] font-semibold text-apple-charcoal mb-1">
              Drop your attendance reports here
            </p>

            <p className="text-sm text-apple-smoke mb-5">
              or click to browse from your computer
            </p>

            <div className="flex items-center gap-2">
              {["XLS", "XLSX", "CSV"].map((f) => (
                <span
                  key={f}
                  className="text-2xs font-mono px-2.5 py-1 rounded-md bg-apple-mist border border-apple-silver"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            {files.map((file, i) => {
              const ext = file.name.split(".").pop()?.toUpperCase();

              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-apple-charcoal/5 flex items-center justify-center">
                    <FileSpreadsheet size={22} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {file.name}
                    </p>

                    <p className="text-xs text-apple-smoke">
                      {(file.size / 1024).toFixed(1)} KB • .{ext}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = files.filter((_, idx) => idx !== i);
                      setFiles(updated);
                    }}
                    className="w-8 h-8 rounded-full bg-apple-mist flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
          <AlertCircle size={16} className="text-red-500 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-apple-snow border border-apple-mist text-sm">
          <Loader2 size={15} className="animate-spin" />
          Processing files...
        </div>
      )}

      <p className="text-xs text-apple-steel leading-relaxed">
        Your files are processed entirely in the browser.{" "}
        <span className="font-medium text-apple-smoke">
          No data is uploaded to any server.
        </span>
      </p>
    </div>
  );
}
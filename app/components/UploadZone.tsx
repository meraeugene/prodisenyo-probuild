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
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }

  async function handleProcess() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await parseAttendanceFile(file);
      if (result.employees.length === 0) {
        throw new Error("No employee records found. Try exporting as CSV.");
      }
      onParsed(result.employees, result.period);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file.");
    } finally {
      setLoading(false);
    }
  }

  const ext = file?.name.split(".").pop()?.toUpperCase();

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`
          relative rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer
          ${
            dragging
              ? "border-apple-charcoal bg-apple-charcoal/5 scale-[1.01]"
              : file
                ? "border-apple-silver bg-white cursor-default"
                : "border-apple-silver hover:border-apple-ash hover:bg-white/60 bg-white/40"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.xls,.xlsx,.csv"
          onChange={handleChange}
          className="hidden"
        />

        {!file ? (
          <div className="py-16 px-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-apple-charcoal/5 flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110">
              <Upload
                size={28}
                className="text-apple-charcoal"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-[17px] font-semibold text-apple-charcoal tracking-tight mb-1">
              Drop your attendance report here
            </p>
            <p className="text-sm text-apple-smoke mb-5">
              or click to browse from your computer
            </p>
            <div className="flex items-center gap-2">
              {["PDF", "XLS", "XLSX", "CSV"].map((f) => (
                <span
                  key={f}
                  className="text-2xs font-mono font-medium px-2.5 py-1 rounded-md bg-apple-mist text-apple-ash border border-apple-silver"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-apple-charcoal/5 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet size={22} className="text-apple-charcoal" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-apple-charcoal truncate">
                {file.name}
              </p>
              <p className="text-xs text-apple-smoke mt-0.5">
                {(file.size / 1024).toFixed(1)} KB &bull; .{ext}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setError(null);
              }}
              className="w-8 h-8 rounded-full bg-apple-mist hover:bg-apple-silver transition-colors flex items-center justify-center"
            >
              <X size={14} className="text-apple-ash" />
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
          <AlertCircle
            size={16}
            className="text-red-500 mt-0.5 flex-shrink-0"
          />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleProcess}
          disabled={!file || loading}
          className={`
            flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold
            transition-all duration-200
            ${
              file && !loading
                ? "bg-apple-charcoal text-white hover:bg-apple-black active:scale-[0.98] shadow-apple"
                : "bg-apple-mist text-apple-steel cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Processing…
            </>
          ) : (
            <>
              <Upload size={15} /> Process File
            </>
          )}
        </button>
      </div>

      {/* Info note */}
      <p className="text-xs text-apple-steel leading-relaxed">
        Your file is processed entirely in the browser.{" "}
        <span className="font-medium text-apple-smoke">
          No data is uploaded to any server.
        </span>
      </p>
    </div>
  );
}

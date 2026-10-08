"use client";

import { CalendarDays, Calculator, MapPin, X } from "lucide-react";

interface PayrollCalculationHeaderProps {
  employeeName: string;
  roleName: string;
  siteLabel: string;
  periodLabel: string | null;
  matchStatus?: "MATCHED" | "NEEDS_REVIEW" | "UNMATCHED";
  rawAliases?: string[];
  onResolveIdentity?: () => void;
  onClose: () => void;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function PayrollCalculationHeader({
  employeeName,
  roleName,
  siteLabel,
  periodLabel,
  matchStatus,
  rawAliases = [],
  onResolveIdentity,
  onClose,
}: PayrollCalculationHeaderProps) {
  return (
    <header className="shrink-0 border-b border-slate-200 bg-white">
      <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5">
        <div className="flex shrink-0 items-center gap-3 sm:border-r sm:border-slate-200 sm:pr-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-slate-950">
            <Calculator size={16} className="text-teal-700" aria-hidden="true" />
            Calculation Details
          </h2>
        </div>

        <div className="order-2 flex min-w-0 basis-full flex-wrap items-center gap-x-4 gap-y-2 sm:order-none sm:flex-1 sm:basis-0">
          <div className="flex min-w-0 flex-1 basis-60 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-700 text-[13px] font-medium text-white">
              {getInitials(employeeName)}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="break-words text-[13px] font-medium text-slate-950">{employeeName}</p>
              <span className="mt-0.5 inline-flex max-w-full rounded bg-teal-50 px-1.5 py-0.5 text-[13px] font-medium text-teal-700">
                {roleName}
              </span>
              {matchStatus && matchStatus !== "MATCHED" ? (
                <button type="button" onClick={onResolveIdentity} className="ml-1.5 inline-flex h-9 items-center rounded-lg bg-amber-50 px-3 text-[13px] font-medium text-amber-700 hover:bg-amber-100">
                  {matchStatus === "NEEDS_REVIEW" ? "Needs Review" : "Unmatched"} - Resolve
                </button>
              ) : null}
              {rawAliases.length > 0 && rawAliases.some((alias) => alias !== employeeName) ? (
                <p className="mt-1 break-words text-[13px] text-slate-400" title={rawAliases.join(", ")}>Biometric: {rawAliases.join(", ")}</p>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 basis-64 items-start gap-2 text-[13px] text-slate-600">
            <MapPin size={16} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
            <div className="min-w-0">
              <p className="break-words font-medium text-slate-800">{siteLabel}</p>
              <p className="text-[13px] text-slate-400">Site</p>
            </div>
          </div>

          {periodLabel ? (
            <div className="flex items-start gap-2 text-[13px] text-slate-600">
              <CalendarDays size={16} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
              <div>
                <p className="font-medium text-slate-800">{periodLabel}</p>
                <p className="text-[13px] text-slate-400">Payroll cutoff</p>
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close calculation details"
          className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <X size={18} />
        </button>
      </div>
    </header>
  );
}

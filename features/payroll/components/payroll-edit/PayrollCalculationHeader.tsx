"use client";

import { X } from "lucide-react";

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
      <div className="flex min-h-16 items-center gap-3 px-4 py-2 sm:px-6">
        <div className="flex shrink-0 items-center gap-3 border-r border-slate-200 pr-4 sm:pr-6">
          <h2 className="hidden text-base font-semibold text-slate-950 min-[460px]:block">
            Calculation Details
          </h2>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-700 text-[13px] font-medium text-white">
              {getInitials(employeeName)}
            </span>
            <div className="max-w-44 leading-tight">
              <p className="truncate text-[13px] font-medium text-slate-950">{employeeName}</p>
              <span className="mt-0.5 inline-flex max-w-full truncate rounded bg-teal-50 px-1.5 py-0.5 text-[13px] font-medium text-teal-700">
                {roleName}
              </span>
              {matchStatus && matchStatus !== "MATCHED" ? (
                <button type="button" onClick={onResolveIdentity} className="ml-1.5 inline-flex h-9 items-center rounded-lg bg-amber-50 px-3 text-[13px] font-medium text-amber-700 hover:bg-amber-100">
                  {matchStatus === "NEEDS_REVIEW" ? "Needs Review" : "Unmatched"} - Resolve
                </button>
              ) : null}
              {rawAliases.length > 0 && rawAliases.some((alias) => alias !== employeeName) ? (
                <p className="mt-1 max-w-44 truncate text-[13px] text-slate-400" title={rawAliases.join(", ")}>Biometric: {rawAliases.join(", ")}</p>
              ) : null}
            </div>
          </div>

          <div className="hidden h-9 w-px shrink-0 bg-slate-200 sm:block" />
          <div className="flex shrink-0 items-center gap-2 text-[13px] text-slate-600">
            <div>
              <p className="font-medium text-slate-800">{siteLabel}</p>
              <p className="text-[13px] text-slate-400">Site</p>
            </div>
          </div>

          {periodLabel ? (
            <>
              <div className="hidden h-9 w-px shrink-0 bg-slate-200 sm:block" />
              <div className="flex shrink-0 items-center gap-2 text-[13px] text-slate-600">
                <div>
                  <p className="font-medium text-slate-800">{periodLabel}</p>
                  <p className="text-[13px] text-slate-400">Payroll cutoff</p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close calculation details"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <X size={18} />
        </button>
      </div>
    </header>
  );
}

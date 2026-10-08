import { CalendarDays, Download, Settings2, X } from "lucide-react";
import type { Step2Sort } from "@/types";
import type { PayrollReviewFilter } from "@/features/payroll/utils/payrollWorkspace";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";

interface PayrollWorkspaceControlsProps {
  activeView: PayrollReviewFilter | "logs";
  allCount: number;
  reviewCount: number;
  readyCount: number;
  search: string;
  site: string;
  sort: Step2Sort;
  sites: string[];
  exportDisabled: boolean;
  onViewChange: (view: PayrollReviewFilter | "logs") => void;
  onSearchChange: (value: string) => void;
  onSiteChange: (value: string) => void;
  onSortChange: (value: Step2Sort) => void;
  onClear: () => void;
  onRates: () => void;
  onHolidays: () => void;
  onExport: () => void;
}

export default function PayrollWorkspaceControls({
  activeView, allCount, reviewCount, readyCount, search, site, sort, sites,
  exportDisabled, onViewChange, onSearchChange, onSiteChange, onSortChange,
  onClear, onRates, onHolidays, onExport,
}: PayrollWorkspaceControlsProps) {
  const tabs: Array<{ value: PayrollReviewFilter | "logs"; label: string; count?: number }> = [
    { value: "all", label: "All Employees", count: allCount },
    { value: "review", label: "Needs Review", count: reviewCount },
    { value: "ready", label: "Ready", count: readyCount },
    { value: "logs", label: "Attendance Logs" },
  ];

  return (
    <div>
      <WorkspaceTabSwitch items={tabs} value={activeView} onChange={onViewChange} mode="filter" label="Payroll records view" className="pb-4" />

      <div className="flex flex-col gap-3 pb-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-2 2xl:max-w-[760px] 2xl:grid-cols-[minmax(220px,1fr)_170px_190px]">
          <label className="relative block">
            <input data-search-field="true"
              aria-label="Search payroll employees"
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search employee name or ID..."
              className="h-11 w-full rounded-[8px] border border-[#cfdae1] bg-white pl-3 pr-4 text-sm text-[#21354d] outline-none transition placeholder:text-[#8da0b1] focus:border-[#0b8f85] focus:ring-4 focus:ring-[#0b8f85]/10"
            />
          </label>

          <label className="relative">
            <select
              aria-label="Filter payroll by site"
              value={site}
              onChange={(event) => onSiteChange(event.target.value)}
              className="h-11 w-full rounded-[8px] border border-[#cfdae1] bg-white pl-3 pr-8 text-sm font-medium text-[#31465e] outline-none focus:border-[#0b8f85] focus:ring-4 focus:ring-[#0b8f85]/10"
            >
              <option value="ALL">All Sites</option>
              {sites.map((siteName) => <option key={siteName} value={siteName}>{siteName}</option>)}
            </select>
          </label>

          <label className="relative">
            <select
              aria-label="Sort payroll employees"
              value={sort}
              onChange={(event) => onSortChange(event.target.value as Step2Sort)}
              className="h-11 w-full rounded-[8px] border border-[#cfdae1] bg-white pl-3 pr-8 text-sm font-medium text-[#31465e] outline-none focus:border-[#0b8f85] focus:ring-4 focus:ring-[#0b8f85]/10"
            >
              <option value="name-asc">Sort by Name (A-Z)</option>
              <option value="name-desc">Sort by Name (Z-A)</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <ToolbarButton icon={Settings2} label="Rates" onClick={onRates} />
          <ToolbarButton icon={CalendarDays} label="Paid Holidays" onClick={onHolidays} />
          <ToolbarButton icon={Download} label="Export" onClick={onExport} disabled={exportDisabled} />
          <ToolbarButton icon={X} label="Clear Filters" onClick={onClear} />
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon, label, onClick, disabled,
}: {
  icon: typeof Settings2;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] border border-slate-400 bg-white px-4 text-sm font-semibold text-[#31465e] transition hover:border-[#076d69] hover:bg-[#f8fbfb] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

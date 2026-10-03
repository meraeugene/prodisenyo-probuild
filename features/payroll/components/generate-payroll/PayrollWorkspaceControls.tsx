import { CalendarDays, Download, Settings2, X } from "lucide-react";
import type { Step2Sort } from "@/types";
import type { PayrollReviewFilter } from "@/features/payroll/utils/payrollWorkspace";

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
  const tabs: Array<{ id: PayrollReviewFilter | "logs"; label: string }> = [
    { id: "all", label: "All Employees (" + allCount + ")" },
    { id: "review", label: "Needs Review (" + reviewCount + ")" },
    { id: "ready", label: "Ready (" + readyCount + ")" },
    { id: "logs", label: "Attendance Logs" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-x-7 gap-y-3 border-b border-[#dce7eb] px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onViewChange(tab.id)}
            className={activeView === tab.id
              ? "relative shrink-0 px-0.5 pb-3 text-sm font-semibold text-[#08766f]"
              : "relative shrink-0 px-0.5 pb-3 text-sm font-semibold text-[#54677f] transition hover:text-[#1c334e]"}
          >
            {tab.label}
            {activeView === tab.id ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#0b8f85]" /> : null}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 py-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-2 2xl:max-w-[760px] 2xl:grid-cols-[minmax(220px,1fr)_170px_190px]">
          <label className="relative block">
            <input data-search-field="true"
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search employee name or ID..."
              className="h-11 w-full rounded-[8px] border border-[#cfdae1] bg-white pl-3 pr-4 text-sm text-[#21354d] outline-none transition placeholder:text-[#8da0b1] focus:border-[#0b8f85] focus:ring-4 focus:ring-[#0b8f85]/10"
            />
          </label>

          <label className="relative">
            <select
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
      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] border border-[#cfdae1] bg-white px-4 text-sm font-semibold text-[#31465e] transition hover:border-[#7cb9b4] hover:bg-[#f8fbfb] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

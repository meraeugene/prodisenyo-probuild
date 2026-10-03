import { CEO_PROJECT_TABS, type CeoProjectTab } from "../utils/ceoProjectFilters";

const controlClass = "h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

export default function CeoGmeaProjectFilters({ tab, tabCounts, query, filter, sort, clients, onTabChange, onQueryChange, onFilterChange, onSortChange }: {
  tab: CeoProjectTab;
  tabCounts: Record<CeoProjectTab, number>;
  query: string;
  filter: string;
  sort: string;
  clients: string[];
  onTabChange: (tab: CeoProjectTab) => void;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  onSortChange: (sort: string) => void;
}) {
  return (
    <div>
      <nav aria-label="Filter projects by status" className="flex flex-wrap gap-x-2 gap-y-1 border-b border-slate-100 px-4 pt-3">
        {CEO_PROJECT_TABS.map((name) => (
          <button type="button" key={name} onClick={() => onTabChange(name)} aria-pressed={tab === name} className={`border-b-2 px-3 py-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600 ${tab === name ? "border-teal-600 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
            {name} ({tabCounts[name]})
          </button>
        ))}
      </nav>
      <div className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_200px_190px]">
        <input data-search-field="true" aria-label="Search projects" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search projects, clients, or locations" className={controlClass} />
        <select aria-label="Filter projects" value={filter} onChange={(event) => onFilterChange(event.target.value)} className={controlClass}>
          <option value="all">All clients</option>
          {clients.map((client) => <option key={client} value={`client:${client}`}>{client}</option>)}
          <option value="new">Unread expenses</option>
          <option value="over-contract">Expenses over contract</option>
        </select>
        <select aria-label="Sort projects" value={sort} onChange={(event) => onSortChange(event.target.value)} className={controlClass}>
          <option value="latest">Sort: Latest</option><option value="name">Sort: Project Name</option><option value="contract">Sort: Contract Amount</option>
        </select>
      </div>
    </div>
  );
}

"use client";

export default function ProjectWorkspaceTabs<Tab extends string>({
  tabs,
  activeTab,
  disabled,
  onSelect,
}: {
  tabs: readonly Tab[];
  activeTab: Tab;
  disabled: boolean;
  onSelect: (tab: Tab) => void;
}) {
  return (
    <nav aria-label="Project sections" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5">
      {tabs.map((item) => {
        const isActive = activeTab === item;
        return (
          <button
            type="button"
            key={item}
            onClick={() => onSelect(item)}
            aria-current={isActive ? "page" : undefined}
            disabled={disabled}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${
              isActive
                ? "bg-[#076d69] text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            } cursor-pointer disabled:cursor-default`}
          >
            {item}
          </button>
        );
      })}
    </nav>
  );
}

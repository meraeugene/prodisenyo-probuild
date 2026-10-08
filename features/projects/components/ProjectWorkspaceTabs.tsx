"use client";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";

export default function ProjectWorkspaceTabs<Tab extends string>({ tabs, activeTab, disabled, onSelect }: {
  tabs: readonly Tab[]; activeTab: Tab; disabled: boolean; onSelect: (tab: Tab) => void;
}) {
  return <WorkspaceTabSwitch items={tabs.map((value) => ({ value, label: value.replaceAll("-", " ") }))}
    value={activeTab} onChange={onSelect} disabled={disabled} label="Project sections" className="capitalize" />;
}
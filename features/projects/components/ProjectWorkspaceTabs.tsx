"use client";
import styles from "@/components/workspace/workspace.module.css";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";
import { getProjectWorkspaceTabLabel } from "../utils/workspaceTabs";

export default function ProjectWorkspaceTabs<Tab extends string>({ tabs, activeTab, disabled, onSelect }: {
  tabs: readonly Tab[]; activeTab: Tab; disabled: boolean; onSelect: (tab: Tab) => void;
}) {
  return <div className={`${styles.panel} p-3`}><WorkspaceTabSwitch items={tabs.map((value) => ({ value, label: getProjectWorkspaceTabLabel(value) }))}
    value={activeTab} onChange={onSelect} disabled={disabled} label="Project sections" className="capitalize" /></div>;
}

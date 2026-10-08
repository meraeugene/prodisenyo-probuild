"use client";

import { useRef, type ReactNode } from "react";
import styles from "./workspace.module.css";

export type WorkspaceTabItem<T extends string> = { value: T; label: ReactNode; count?: number; color?: string };

export default function WorkspaceTabSwitch<T extends string>({ items, value, onChange, label, disabled = false, mode = "section", idPrefix, panelId, className = "" }: {
  items: readonly WorkspaceTabItem<T>[]; value: T; onChange: (value: T) => void; label: string;
  disabled?: boolean; mode?: "filter" | "section" | "panel"; idPrefix?: string; panelId?: string; className?: string;
}) {
  const buttons = useRef(new Map<T, HTMLButtonElement>());
  return <nav aria-label={label} role={mode === "panel" ? "tablist" : undefined} className={`${styles.tabSwitch} ${className}`}>
    {items.map((item, index) => <button key={item.value} type="button" data-workspace-tab="true" data-selected={value === item.value}
      className={styles.switchButton} disabled={disabled}
      ref={(element) => { if (element) buttons.current.set(item.value, element); else buttons.current.delete(item.value); }}
      role={mode === "panel" ? "tab" : undefined} aria-selected={mode === "panel" ? value === item.value : undefined}
      aria-pressed={mode === "filter" ? value === item.value : undefined} aria-current={mode === "section" && value === item.value ? "page" : undefined}
      id={idPrefix ? `${idPrefix}-${item.value}` : undefined} aria-controls={panelId}
      tabIndex={mode === "panel" ? value === item.value ? 0 : -1 : undefined}
      onClick={() => onChange(item.value)} onKeyDown={(event) => {
        if (disabled) return;
        const next = event.key === "ArrowRight" ? (index + 1) % items.length : event.key === "ArrowLeft" ? (index + items.length - 1) % items.length : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : null;
        if (next === null) return;
        event.preventDefault(); onChange(items[next].value); buttons.current.get(items[next].value)?.focus();
      }}>
      <span>{item.label}</span>
      {item.count !== undefined && <span className={styles.tabCount}>{item.count}</span>}
    </button>)}
  </nav>;
}

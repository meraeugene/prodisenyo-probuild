"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SidebarNavigationContext, SidebarNavigationItem } from "../types";
import SidebarNavigationLink from "./SidebarNavigationLink";
import SidebarTooltip from "./SidebarTooltip";
import styles from "./sidebarNavigation.module.css";

export default function SidebarNavigationDropdown({ item, role, pathname, collapsed, onNavigate, notificationCounts }: SidebarNavigationContext & { item: SidebarNavigationItem }) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  const [open, setOpen] = useState(active);
  const id = useId();
  useEffect(() => { if (active) setOpen(true); }, [active, pathname]);
  const badgeCount = role === "ceo" && item.badgeKey ? notificationCounts[item.badgeKey] : 0;
  return <div>
    <SidebarTooltip active={collapsed} label={item.label}>
      <button type="button" aria-expanded={open} aria-controls={id} aria-label={collapsed ? item.label : undefined}
        onClick={() => setOpen(value => !value)} className={cn(
          "relative flex min-h-10 w-full items-center gap-3 rounded-[10px] px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700",
          collapsed && "justify-center px-2.5",
          active ? "bg-[#eaf5f3] font-medium text-[#076d69]" : "text-[#365753] hover:bg-teal-50/60 hover:text-[#076d69]",
        )}>
        <item.icon size={17} strokeWidth={1.7} aria-hidden="true" className="shrink-0" />
        {!collapsed && <><span className="min-w-0 flex-1 text-left">{item.label}</span>
          {badgeCount > 0 && <span className="rounded-md bg-[#e2f1ee] px-1.5 text-[10px] font-semibold">{badgeCount > 99 ? "99+" : badgeCount}</span>}
          <ChevronDown size={14} aria-hidden="true" className={cn("transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")} /></>}
      </button>
    </SidebarTooltip>
    <div id={id} data-open={open} aria-hidden={!open} ref={element => { if (element) element.inert = !open; }} className={styles.dropdown}>
      <div className={styles.dropdownClip}><div className={cn("space-y-1 pt-1", !collapsed && "ml-5 pl-2")}>
      {item.children?.map(child => <SidebarNavigationLink key={child.href} item={child} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate}
        badgeCount={role === "ceo" && child.badgeKey ? notificationCounts[child.badgeKey] : 0} />)}
      </div></div>
    </div>
  </div>;
}

import NavigationLink from "@/components/navigation/NavigationLink";
import { cn } from "@/lib/utils";
import type { SidebarNavigationItem } from "../types";
import SidebarTooltip from "./SidebarTooltip";

export default function SidebarNavigationLink({ item, pathname, collapsed, onNavigate, badgeCount = 0 }: {
  item: SidebarNavigationItem; pathname: string; collapsed: boolean; onNavigate: () => void; badgeCount?: number;
}) {
  const active = (item.activePaths ?? [item.href]).some((path) => pathname === path || pathname.startsWith(`${path}/`));
  return (
    <SidebarTooltip active={collapsed} label={item.label}>
      <NavigationLink href={item.href} onClick={onNavigate} aria-label={collapsed ? `${item.label}${badgeCount ? `, ${badgeCount} pending` : ""}` : undefined} aria-current={active ? "page" : undefined} className={cn(
        "group relative flex min-h-10 w-full items-center gap-3 rounded-[10px] px-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2",
        collapsed && "justify-center px-2.5",
        active ? "bg-[#eaf5f3] font-medium text-[#076d69]" : "text-[#365753] hover:bg-teal-50/60 hover:text-[#076d69]",
      )}>
        <item.icon size={17} strokeWidth={1.7} className="shrink-0" aria-hidden="true" />
        {!collapsed && <span className="min-w-0 flex-1 whitespace-nowrap">{item.label}</span>}
        {badgeCount > 0 && <span className={cn("inline-flex h-5 min-w-6 shrink-0 items-center justify-center rounded-md bg-[#e2f1ee] px-1.5 text-[10px] font-semibold text-[#076d69]", collapsed ? "absolute -right-1 -top-1" : "ml-3")}>{badgeCount > 99 ? "99+" : badgeCount}</span>}
      </NavigationLink>
    </SidebarTooltip>
  );
}

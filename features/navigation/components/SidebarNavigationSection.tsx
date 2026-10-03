import type { SidebarNavigationContext, SidebarNavigationGroup } from "../types";
import SidebarNavigationLink from "./SidebarNavigationLink";

export default function SidebarNavigationSection({ group, role, pathname, collapsed, onNavigate, notificationCounts }: SidebarNavigationContext & {
  group: SidebarNavigationGroup;
}) {
  return (
    <section aria-label={group.label} className="space-y-1 [&:first-child>h2]:pt-1 [&:first-child>div]:mt-1">
      {group.label && (collapsed ? (
        <div aria-hidden="true" className="mx-auto my-4 w-6 border-t border-teal-900/10" />
      ) : (
        <h2 className="px-3 pb-2 pt-6 text-[11px] font-medium text-[#53736f]">{group.label}</h2>
      ))}
      {group.items.map((item) => (
        <SidebarNavigationLink
          key={item.href}
          item={item}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
          badgeCount={role === "ceo" && item.badgeKey ? notificationCounts[item.badgeKey] : 0}
        />
      ))}
    </section>
  );
}

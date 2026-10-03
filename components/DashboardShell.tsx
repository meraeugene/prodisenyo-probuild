"use client";

import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import DashboardNavigation from "@/features/navigation/components/DashboardNavigation";
import DashboardBrand from "@/features/navigation/components/DashboardBrand";
import SidebarAccount from "@/features/navigation/components/SidebarAccount";
import SidebarTooltip from "@/features/navigation/components/SidebarTooltip";
import { useSidebarNotificationCounts } from "@/features/navigation/hooks/useSidebarNotificationCounts";
import { useDashboardSidebar } from "@/features/navigation/hooks/useDashboardSidebar";
import type { SidebarProfile } from "@/features/navigation/types";
import { cn } from "@/lib/utils";

export default function DashboardShell({ children, profile }: {
  children: React.ReactNode; profile: SidebarProfile | null;
}) {
  const pathname = usePathname();
  const { open, setOpen, collapsed, setCollapsed } = useDashboardSidebar(pathname);
  const notificationCounts = useSidebarNotificationCounts(profile?.role === "ceo");
  const narrow = collapsed && !open;

  return (
    <div className="min-h-screen bg-white [--dashboard-header-height:72px]">
      <a href="#dashboard-content" className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-white p-3 text-sm text-[#076d69] shadow-sm focus:not-sr-only">Skip to content</a>
      {open && <button type="button" aria-label="Close navigation overlay" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px] lg:hidden" />}
      <aside id="dashboard-sidebar" aria-label="Workspace sidebar" role={open ? "dialog" : undefined} aria-modal={open || undefined} className={cn(
        "fixed left-0 top-0 z-50 flex h-[100dvh] flex-col bg-white shadow-[1px_0_12px_rgba(24,55,52,0.025)] transition-[transform,width] duration-300 motion-reduce:transition-none lg:translate-x-0",
        narrow ? "w-[72px]" : "w-[248px] max-w-[calc(100vw-40px)]",
        open ? "visible translate-x-0" : "invisible -translate-x-full lg:visible",
      )}>
        <div className={cn("relative flex h-[92px] shrink-0 items-center justify-between", narrow ? "px-[18px]" : "px-3")}>
          <DashboardBrand collapsed={narrow} />
          <SidebarTooltip active label={narrow ? "Expand sidebar" : "Collapse sidebar"}>
            <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={narrow ? "Expand navigation" : "Collapse navigation"} aria-expanded={!narrow} aria-controls="dashboard-sidebar" className={cn(
              "hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#53736f] transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 lg:flex",
              narrow && "absolute -right-3 top-8 bg-white shadow-[0_1px_6px_rgba(24,55,52,0.06)]",
            )}>{narrow ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}</button>
          </SidebarTooltip>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#53736f] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 lg:hidden"><X size={17} /></button>
        </div>
        <div className="sidebar-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <DashboardNavigation role={profile?.role ?? null} pathname={pathname} collapsed={narrow} onNavigate={() => setOpen(false)} notificationCounts={notificationCounts} />
          <SidebarAccount profile={profile} pathname={pathname} collapsed={narrow} onNavigate={() => setOpen(false)} />
        </div>
      </aside>
      <div className={cn("min-h-screen transition-[padding] duration-300 motion-reduce:transition-none", collapsed ? "lg:pl-[72px]" : "lg:pl-[248px]")}>
        <div className="sticky top-0 z-30 flex h-[72px] items-center justify-between bg-white/95 px-4 shadow-[0_1px_8px_rgba(24,55,52,0.03)] backdrop-blur-lg lg:hidden">
          <DashboardBrand />
          <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open} aria-controls="dashboard-sidebar" className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[#076d69] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"><Menu size={20} /></button>
        </div>
        <main id="dashboard-content" data-workspace tabIndex={-1} className="min-h-screen bg-white outline-none">{children}</main>
      </div>
    </div>
  );
}

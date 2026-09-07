"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronsLeft, ChevronsRight, Menu, Settings, X } from "lucide-react";
import DashboardNavigation from "@/features/navigation/components/DashboardNavigation";
import SignOutButton from "@/components/auth/SignOutButton";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useAppState } from "@/features/app/AppStateProvider";
import { useDashboardNavState } from "@/features/navigation/hooks/useDashboardNavState";
import { useSidebarNotificationCounts } from "@/features/navigation/hooks/useSidebarNotificationCounts";
import { getProfileAvatarPublicUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

const NO_SCROLL_CLASS = "overflow-hidden";

type ProfileCardData = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "full_name" | "username" | "avatar_path" | "role"
>;

function formatRoleLabel(role: ProfileCardData["role"] | null): string {
  if (role === "gmea") return "GMEA";
  if (role === "admin") return "Administrator";
  if (role === "ceo") return "Chief Executive Officer";
  if (role === "payroll_manager") return "Payroll Manager";
  if (role === "purchaser") return "Purchaser";
  if (role === "engineer") return "Engineer";
  if (role === "employee") return "Employee";
  return "Signed-in user";
}

export default function DashboardShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: (ProfileCardData & { id: string }) | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { hasAttendanceData, workspaceReset } =
    useAppState();
  const sidebarWidth = collapsed ? "80px" : "286px";
  const headerHeight = "69px";
  const settingsActive = pathname === "/settings";
  const isWorkflowRoute =
    pathname === "/review-attendance" || pathname === "/generate-payroll";
  const isCeo = profile?.role === "ceo";
  const isPayrollManager = profile?.role === "payroll_manager";
  const navState = useDashboardNavState(profile?.id ?? null, profile?.role ?? null);
  const canSeeWorkflowNav =
    isCeo ||
    (isPayrollManager &&
      !workspaceReset &&
      (navState.hasSavedAttendance || hasAttendanceData || isWorkflowRoute));
  const notificationCounts = useSidebarNotificationCounts(isCeo);

  useEffect(() => {
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches;

    if (open && isMobile) {
      document.body.classList.add(NO_SCROLL_CLASS);
      document.documentElement.classList.add(NO_SCROLL_CLASS);
    } else {
      document.body.classList.remove(NO_SCROLL_CLASS);
      document.documentElement.classList.remove(NO_SCROLL_CLASS);
    }

    return () => {
      document.body.classList.remove(NO_SCROLL_CLASS);
      document.documentElement.classList.remove(NO_SCROLL_CLASS);
    };
  }, [open]);

  useEffect(() => {
    document.body.classList.remove(NO_SCROLL_CLASS);
    document.documentElement.classList.remove(NO_SCROLL_CLASS);
    setOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches;

    if (
      isDesktop &&
      (pathname === "/budget-tracker" || pathname === "/cost-estimator")
    ) {
      setCollapsed(true);
      return;
    }

    setCollapsed(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen">
        {/* Mobile sidebar overlay */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed left-0 top-0 z-50 flex h-[100dvh] flex-col overflow-hidden border-r border-apple-mist bg-white transition-transform duration-300 lg:h-screen lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          style={{ width: sidebarWidth }}
        >
          <div
            className="flex shrink-0 items-center justify-between border-b border-apple-mist px-5"
            style={{ height: headerHeight }}
          >
            <div className="flex items-center gap-3">
              <BrandLogoMark />

              {!collapsed ? (
                <p className="font-semibold tracking-[-0.04em] text-apple-charcoal">
                  Prodisenyo ProBuild
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCollapsed((current) => !current)}
                className="hidden h-8 w-8 items-center justify-center rounded-lg text-apple-smoke transition hover:bg-apple-mist/40 hover:text-apple-charcoal lg:flex"
                aria-label={
                  collapsed ? "Expand navigation" : "Collapse navigation"
                }
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronsRight size={16} />
                ) : (
                  <ChevronsLeft size={16} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-apple-mist bg-white text-apple-smoke transition hover:bg-apple-mist/40 hover:text-apple-charcoal lg:hidden"
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pt-5"
            style={{
              WebkitOverflowScrolling: "touch",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
            }}
          >
            <DashboardNavigation role={profile?.role ?? null} pathname={pathname} collapsed={collapsed} onNavigate={() => setOpen(false)} canSeeWorkflowNav={canSeeWorkflowNav} notificationCounts={notificationCounts} />

            <div className="mt-auto space-y-1 pt-3">
              {!collapsed ? (
                <div className="px-3 pb-1 pt-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-apple-silver">
                    Account
                  </p>
                </div>
              ) : null}
              <Link
                href="/settings"
                title={collapsed ? "Settings" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg border border-apple-mist/60 px-3 py-1.5 text-sm transition-all",
                  collapsed && "justify-center px-2.5",
                  settingsActive
                    ? "bg-apple-mist/40 text-apple-charcoal shadow-sm"
                    : "text-apple-smoke hover:bg-apple-mist/40 hover:text-apple-charcoal hover:shadow-sm",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 mr items-center justify-center rounded-full transition-colors",
                    settingsActive
                      ? "bg-[#1f6a37] text-white"
                      : "text-apple-smoke group-hover:text-apple-charcoal",
                  )}
                >
                  <Settings size={15} />
                </div>
                {!collapsed ? (
                  <span className="font-medium">Settings</span>
                ) : null}
              </Link>

              <div className="pt-2">
                <SignOutButton
                  variant="sidebar"
                  collapsed={collapsed}
                  title={collapsed ? "Logout" : undefined}
                />
              </div>

              <div className="pt-4">
                <div
                  title={
                    collapsed
                      ? profile?.full_name?.trim() ||
                        profile?.username ||
                        "Signed-in user"
                      : undefined
                  }
                  className={cn(
                    collapsed
                      ? "flex justify-center"
                      : "rounded-2xl border border-apple-mist bg-white p-3 shadow-[0_8px_20px_rgba(24,83,43,0.06)]",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3",
                      collapsed && "justify-center",
                    )}
                  >
                    <ProfileAvatar
                      avatarUrl={getProfileAvatarPublicUrl(
                        profile?.avatar_path,
                      )}
                      name={profile?.full_name?.trim() || profile?.username}
                      sizeClassName={collapsed ? "h-8 w-8" : "h-10 w-10"}
                      textClassName="text-xs"
                    />
                    {!collapsed ? (
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-apple-charcoal">
                          {profile?.full_name?.trim() ||
                            profile?.username ||
                            "Signed-in user"}
                        </p>
                        <p className="truncate text-xs text-apple-steel">
                          {profile?.username
                            ? ` ${formatRoleLabel(profile.role)}`
                            : "Loading account details..."}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {!collapsed ? (
                  <p className="pt-4 text-center text-[11px] text-[#b6c1c7]">
                    Copyright @2026 Veron Software. <br />
                    All rights reserved.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        <div
          className={cn(
            "min-h-screen transition-[padding] duration-300",
            collapsed ? "lg:pl-[80px]" : "lg:pl-[286px]",
          )}
        >
          {/* Mobile top bar */}
          <div
            className="sticky top-0 z-30 flex items-center justify-between border-b border-apple-mist bg-white px-4 lg:hidden"
            style={{ height: headerHeight }}
          >
            <div className="flex items-center gap-3">
              <BrandLogoMark />
              <p className="font-semibold tracking-[-0.04em] text-apple-charcoal">
                Prodisenyo ProBuild
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-apple-mist text-apple-charcoal hover:bg-apple-mist/40"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
          </div>

          <main className="min-h-screen bg-white ">{children}</main>
        </div>
      </div>
    </div>
  );
}

function BrandLogoMark() {
  return (
    <span className="relative block h-9 w-9 shrink-0">
      <Image
        src="/prodisenyo-building-mark.png"
        alt="Prodisenyo building mark"
        fill
        sizes="36px"
        className="object-contain"
        priority
      />
    </span>
  );
}

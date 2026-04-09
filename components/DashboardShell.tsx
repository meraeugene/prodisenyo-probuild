"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Calculator,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  LineChart,
  Menu,
  Users,
  Receipt,
  Settings,
  Upload,
  UserPlus,
  UserRoundSearch,
  Wallet,
  X,
} from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useAppState } from "@/features/app/AppStateProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getProfileAvatarPublicUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

const PRIMARY_NAV_ITEMS = [
  { href: "/upload-attendance", label: "Upload Attendance", icon: Upload },
];

const CEO_GENERAL_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;

const CEO_REVIEW_ITEMS = [
  {
    href: "/payroll-reports",
    label: "Payroll Reports",
    icon: LineChart,
  },
  {
    href: "/overtime-approvals",
    label: "Overtime Approvals",
    icon: Clock3,
  },
  {
    href: "/estimate-reviews",
    label: "Estimate Reviews",
    icon: Calculator,
  },
] as const;

const GENERAL_WORKFLOW_ITEMS = [
  {
    href: "/review-attendance",
    label: "Review Attendance",
    icon: UserRoundSearch,
  },
  { href: "/generate-payroll", label: "Generate Payroll", icon: Wallet },
] as const;

const BUDGET_NAV_ITEMS = [
  { href: "/budget-tracker", label: "Budget Tracker", icon: Receipt },
] as const;

const CEO_ADMIN_ITEMS = [
  { href: "/add-user", label: "User Management", icon: Users },
] as const;

const ENGINEER_NAV_ITEMS = [
  { href: "/cost-estimator", label: "Cost Estimator", icon: Calculator },
] as const;

type ProfileCardData = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "full_name" | "username" | "avatar_path" | "role"
>;

function formatRoleLabel(role: ProfileCardData["role"] | null): string {
  if (role === "ceo") return "Chief Executive Officer";
  if (role === "payroll_manager") return "Payroll Manager";
  if (role === "engineer") return "Engineer";
  return "Signed-in user";
}

function renderSidebarLink(params: {
  item: {
    href: string;
    label: string;
    icon: LucideIcon;
  };
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
  badgeCount?: number;
}) {
  const { item, pathname, collapsed, onNavigate, badgeCount = 0 } = params;
  const active = pathname === item.href;

  return (
    <Link
      key={item.href}
      href={item.href}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border border-apple-mist/60 px-3 py-1.5 text-sm transition-all",
        collapsed && "justify-center px-2.5",
        active
          ? "bg-apple-mist/40 text-apple-charcoal shadow-sm"
          : "text-apple-smoke hover:bg-apple-mist/40 hover:text-apple-charcoal hover:shadow-sm",
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
          active
            ? "bg-[#1f6a37] text-white"
            : "text-apple-smoke group-hover:text-apple-charcoal",
        )}
      >
        <item.icon size={15} />
      </div>
      {!collapsed ? (
        <span className="min-w-0 flex-1 font-medium whitespace-nowrap">
          {item.label}
        </span>
      ) : null}
      {badgeCount > 0 ? (
        <span
          className={cn(
            "inline-flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-full bg-[#1f6a37] px-2 py-0.5 text-[11px] font-bold text-white",
            collapsed ? "absolute -right-1 -top-1" : "ml-1",
          )}
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
    </Link>
  );
}

export default function DashboardShell({
  children,
  profile,
  navState,
}: {
  children: React.ReactNode;
  profile: ProfileCardData | null;
  navState: {
    hasSavedAttendance: boolean;
    hasSavedPayroll: boolean;
  };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { hasAttendanceData, currentPayrollRunId, workspaceReset } =
    useAppState();
  const sidebarWidth = collapsed ? "80px" : "286px";
  const headerHeight = "69px";
  const settingsActive = pathname === "/settings";
  const isWorkflowRoute =
    pathname === "/review-attendance" || pathname === "/generate-payroll";
  const isCeo = profile?.role === "ceo";
  const isEngineer = profile?.role === "engineer";
  const canSeeWorkflowNav =
    isCeo ||
    (!isEngineer &&
      !workspaceReset &&
      (navState.hasSavedAttendance || hasAttendanceData || isWorkflowRoute));
  const [pendingOvertimeCount, setPendingOvertimeCount] = useState(0);
  const [pendingPayrollReportCount, setPendingPayrollReportCount] = useState(0);
  const [pendingEstimateReviewCount, setPendingEstimateReviewCount] = useState(0);
  const previousPendingCountRef = useRef<number | null>(null);
  const previousEstimateReviewCountRef = useRef<number | null>(null);
  const canPlayNotificationSoundRef = useRef(false);

  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    setOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/budget-tracker" || pathname === "/cost-estimator") {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [pathname]);

  useEffect(() => {
    function enableSound() {
      canPlayNotificationSoundRef.current = true;
    }

    window.addEventListener("pointerdown", enableSound, { once: true });
    window.addEventListener("keydown", enableSound, { once: true });

    return () => {
      window.removeEventListener("pointerdown", enableSound);
      window.removeEventListener("keydown", enableSound);
    };
  }, []);

  useEffect(() => {
    if (!isCeo) {
      setPendingOvertimeCount(0);
      setPendingPayrollReportCount(0);
      setPendingEstimateReviewCount(0);
      previousPendingCountRef.current = null;
      previousEstimateReviewCountRef.current = null;
      return;
    }

    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    async function loadPendingOvertimeCount() {
      const [
        { count: overtimeCount, error: overtimeError },
        { count: payrollReportCount, error: payrollReportError },
        { count: estimateReviewCount, error: estimateReviewError },
      ] = await Promise.all([
        supabase
          .from("payroll_adjustments")
          .select("id", { count: "exact", head: true })
          .eq("adjustment_type", "overtime")
          .eq("status", "pending"),
        supabase
          .from("payroll_runs")
          .select("id", { count: "exact", head: true })
          .eq("status", "submitted"),
        supabase
          .from("project_estimates")
          .select("id", { count: "exact", head: true })
          .eq("status", "submitted"),
      ]);

      if (
        cancelled ||
        overtimeError ||
        payrollReportError ||
        estimateReviewError
      ) {
        return;
      }

      const nextCount = overtimeCount ?? 0;
      const previousCount = previousPendingCountRef.current;
      const nextEstimateCount = estimateReviewCount ?? 0;
      const previousEstimateCount = previousEstimateReviewCountRef.current;
      setPendingOvertimeCount(nextCount);
      setPendingPayrollReportCount(payrollReportCount ?? 0);
      setPendingEstimateReviewCount(nextEstimateCount);

      if (
        previousCount !== null &&
        nextCount > previousCount &&
        canPlayNotificationSoundRef.current
      ) {
        const audio = new Audio("/sounds/overtime-approval.mp3");
        audio.volume = 0.9;
        void audio.play().catch(() => undefined);
      }

      if (
        previousEstimateCount !== null &&
        nextEstimateCount > previousEstimateCount &&
        canPlayNotificationSoundRef.current
      ) {
        const audio = new Audio("/sounds/overtime-approval.mp3");
        audio.volume = 0.9;
        void audio.play().catch(() => undefined);
      }

      previousPendingCountRef.current = nextCount;
      previousEstimateReviewCountRef.current = nextEstimateCount;
    }

    void loadPendingOvertimeCount();

    const intervalId = window.setInterval(() => {
      void loadPendingOvertimeCount();
    }, 30000);

    function handleWindowFocus() {
      void loadPendingOvertimeCount();
    }

    function handlePendingCountChanged() {
      void loadPendingOvertimeCount();
    }

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener(
      "payroll:pending-count-changed",
      handlePendingCountChanged,
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener(
        "payroll:pending-count-changed",
        handlePendingCountChanged,
      );
    };
  }, [isCeo]);

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
            "fixed left-0 top-0 z-50 flex h-screen flex-col overflow-visible border-r border-apple-mist bg-white transition-transform duration-300 lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          style={{ width: sidebarWidth }}
        >
          <div
            className="flex shrink-0 items-center justify-between border-b border-apple-mist px-5"
            style={{ height: headerHeight }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-apple-mist text-apple-charcoal">
                <Building2 className="h-4 w-4" strokeWidth={1.5} />
              </div>

              {!collapsed ? (
                <p className="font-semibold tracking-[-0.04em] text-apple-charcoal">
                  Prodisenyo PayTrack
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
                className="flex h-8 w-8 items-center justify-center rounded-lg text-apple-smoke hover:bg-apple-mist/40 hover:text-apple-charcoal lg:hidden"
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-x-visible overflow-y-auto px-4 pb-3 pt-5">
            <nav className="space-y-3">
              {!collapsed ? (
                <div className="px-3 pb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-apple-silver">
                    {isCeo ? "General" : isEngineer ? "Estimator" : "Attendance"}
                  </p>
                </div>
              ) : null}

              {(isCeo
                ? CEO_GENERAL_ITEMS
                : isEngineer
                  ? ENGINEER_NAV_ITEMS
                  : PRIMARY_NAV_ITEMS).map((item) =>
                renderSidebarLink({
                  item,
                  pathname,
                  collapsed,
                  onNavigate: () => setOpen(false),
                }),
              )}

              {isCeo ? (
                <>
                  {!collapsed ? (
                    <div className="px-3 pb-1 pt-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-apple-silver">
                        Review
                      </p>
                    </div>
                  ) : null}

                  {CEO_REVIEW_ITEMS.map((item) =>
                    renderSidebarLink({
                      item,
                      pathname,
                      collapsed,
                      onNavigate: () => setOpen(false),
                      badgeCount:
                        item.href === "/overtime-approvals"
                          ? pendingOvertimeCount
                          : item.href === "/payroll-reports"
                            ? pendingPayrollReportCount
                            : item.href === "/estimate-reviews"
                              ? pendingEstimateReviewCount
                              : 0,
                    }),
                  )}
                </>
              ) : null}

              <AnimatePresence initial={false}>
                {!isCeo && canSeeWorkflowNav ? (
                  <motion.div
                    key="general-workflow-nav"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="space-y-3 overflow-hidden"
                  >
                    {!collapsed ? (
                      <div className="px-3 pb-1 pt-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-apple-silver">
                          Payroll
                        </p>
                      </div>
                    ) : null}
                    {GENERAL_WORKFLOW_ITEMS.map((item, index) => {
                      const active = pathname === item.href;
                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{
                            duration: 0.22,
                            delay: index * 0.04,
                            ease: "easeOut",
                          }}
                        >
                          <Link
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "group relative flex items-center gap-3 rounded-lg border border-apple-mist/60 px-3 py-1.5 text-sm transition-all",
                              collapsed && "justify-center px-2.5",
                              active
                                ? "bg-apple-mist/40 text-apple-charcoal shadow-sm"
                                : "text-apple-smoke hover:bg-apple-mist/40 hover:text-apple-charcoal hover:shadow-sm",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                                active
                                  ? "bg-[#1f6a37] text-white"
                                  : "text-apple-smoke group-hover:text-apple-charcoal",
                              )}
                            >
                              <item.icon size={15} />
                            </div>
                            {!collapsed ? (
                              <span className="font-medium">{item.label}</span>
                            ) : null}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {!collapsed && !isEngineer ? (
                <div className="px-3 pb-1 pt-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-apple-silver">
                    Budget
                  </p>
                </div>
              ) : null}

              {!isEngineer && BUDGET_NAV_ITEMS.map((item) => {
                return renderSidebarLink({
                  item,
                  pathname,
                  collapsed,
                  onNavigate: () => setOpen(false),
                });
              })}

              {isCeo ? (
                <>
                  {!collapsed ? (
                    <div className="px-3 pb-1 pt-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-apple-silver">
                        Admin
                      </p>
                    </div>
                  ) : null}

                  {CEO_ADMIN_ITEMS.map((item) =>
                    renderSidebarLink({
                      item,
                      pathname,
                      collapsed,
                      onNavigate: () => setOpen(false),
                    }),
                  )}
                </>
              ) : null}
            </nav>

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
                {!collapsed ? <span className="font-medium">Settings</span> : null}
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-apple-mist text-apple-charcoal">
                <Building2 className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <p className="font-semibold tracking-[-0.04em] text-apple-charcoal">
                Prodisenyo PayTrack
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

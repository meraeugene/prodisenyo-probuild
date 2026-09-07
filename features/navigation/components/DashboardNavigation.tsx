"use client";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  Calculator,
  Clock3,
  House,
  LayoutDashboard,
  LineChart,
  Users,
  Trash2,
  Upload,
  UserRoundSearch,
  Wallet,
  FolderKanban,
} from "lucide-react";
import type { AppRole } from "@/types/database";
import { cn } from "@/lib/utils";
const PRIMARY_NAV_ITEMS = [
  { href: "/home", label: "Home", icon: House },
  { href: "/upload-attendance", label: "Upload Attendance", icon: Upload },
  { href: "/request-overtime", label: "Request Overtime", icon: Clock3 },
];

const PAYROLL_MANAGER_GENERAL_ITEMS = [
  { href: "/payroll-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload-attendance", label: "Upload Attendance", icon: Upload },
] as const;

const PAYROLL_MANAGER_REQUEST_ITEMS = [
  { href: "/request-overtime", label: "Request Overtime", icon: Clock3 },
] as const;

const CEO_GENERAL_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;

const CEO_PAYROLL_ITEMS = [
  {
    href: "/payroll-analytics",
    label: "Payroll Analytics",
    icon: LayoutDashboard,
  },
  { href: "/payroll-approvals", label: "Payroll Approvals", icon: LineChart },
] as const;

const GMEA_NAV_ITEMS = [
  { href: "/gmea-projects", label: "GMEA Projects", icon: FolderKanban },
] as const;
const CEO_PROJECT_ITEMS = [
  ...GMEA_NAV_ITEMS,
  { href: "/projects", label: "Projects", icon: FolderKanban },
] as const;

const CEO_REVIEW_ITEMS = [
  {
    href: "/overtime-approvals",
    label: "Overtime Approvals",
    icon: Clock3,
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

const CEO_ADMIN_ITEMS = [
  { href: "/add-user", label: "User Management", icon: Users },
  { href: "/reset-data", label: "Reset Data", icon: Trash2 },
] as const;

const ENGINEER_GENERAL_ITEMS = [
  { href: "/overview", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
] as const;

const ENGINEER_PLANNING_ITEMS = [
  { href: "/cost-estimator", label: "Cost Estimator", icon: Calculator },
] as const;

const ENGINEER_REQUEST_ITEMS = [
  { href: "/request-overtime", label: "Request Overtime", icon: Clock3 },
] as const;

const EMPLOYEE_NAV_ITEMS = [
  { href: "/home", label: "Home", icon: House },
  { href: "/request-overtime", label: "Request Overtime", icon: Clock3 },
] as const;
const PURCHASER_NAV_ITEMS = [
  { href: "/purchaser-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/purchasing-approvals", label: "Purchasing", icon: BadgeDollarSign },
] as const;

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

function renderSidebarSectionLabel(params: {
  label: string;
  collapsed: boolean;
}) {
  const { label, collapsed } = params;

  if (collapsed) {
    return null;
  }

  return (
    <div className="px-3 pb-1 pt-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-apple-silver">
        {label}
      </p>
    </div>
  );
}

export default function DashboardNavigation({
  role,
  pathname,
  collapsed,
  onNavigate,
  canSeeWorkflowNav,
  notificationCounts,
}: {
  role: AppRole | null;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
  canSeeWorkflowNav: boolean;
  notificationCounts: {
    overtime: number;
    payrollReports: number;
    estimateReviews: number;
  };
}) {
  const isGmea = role === "gmea",
    isCeo = role === "ceo",
    isAdmin = role === "admin",
    isPayrollManager = role === "payroll_manager",
    isEngineer = role === "engineer",
    isPurchaser = role === "purchaser",
    isEmployee = role === "employee";
  return (
    <nav className="space-y-3">
      {(isGmea
        ? GMEA_NAV_ITEMS
        : isCeo
          ? CEO_GENERAL_ITEMS
          : isAdmin
            ? CEO_ADMIN_ITEMS
            : isPayrollManager
              ? PAYROLL_MANAGER_GENERAL_ITEMS
              : isEngineer
                ? ENGINEER_GENERAL_ITEMS
                : isPurchaser
                  ? PURCHASER_NAV_ITEMS
                  : isEmployee
                    ? EMPLOYEE_NAV_ITEMS
                    : PRIMARY_NAV_ITEMS
      ).map((item) =>
        renderSidebarLink({
          item,
          pathname,
          collapsed,
          onNavigate: onNavigate,
        }),
      )}

      {isCeo ? (
        <>
          {renderSidebarSectionLabel({
            label: "Projects",
            collapsed,
          })}
          {CEO_PROJECT_ITEMS.map((item) =>
            renderSidebarLink({
              item,
              pathname,
              collapsed,
              onNavigate: onNavigate,
            }),
          )}

          {renderSidebarSectionLabel({
            label: "Payroll",
            collapsed,
          })}
          {CEO_PAYROLL_ITEMS.map((item) =>
            renderSidebarLink({
              item,
              pathname,
              collapsed,
              onNavigate: onNavigate,
              badgeCount:
                item.href === "/payroll-approvals"
                  ? notificationCounts.payrollReports
                  : 0,
            }),
          )}

          {renderSidebarSectionLabel({
            label: "Reviews",
            collapsed,
          })}
          {CEO_REVIEW_ITEMS.map((item) =>
            renderSidebarLink({
              item,
              pathname,
              collapsed,
              onNavigate: onNavigate,
              badgeCount:
                item.href === "/overtime-approvals"
                  ? notificationCounts.overtime
                  : 0,
            }),
          )}
        </>
      ) : null}

      {isEngineer ? (
        <>
          {renderSidebarSectionLabel({
            label: "Planning",
            collapsed,
          })}
          {ENGINEER_PLANNING_ITEMS.map((item) =>
            renderSidebarLink({
              item,
              pathname,
              collapsed,
              onNavigate: onNavigate,
            }),
          )}

          {renderSidebarSectionLabel({
            label: "Requests",
            collapsed,
          })}
          {ENGINEER_REQUEST_ITEMS.map((item) =>
            renderSidebarLink({
              item,
              pathname,
              collapsed,
              onNavigate: onNavigate,
            }),
          )}
        </>
      ) : null}

      {isPayrollManager ? (
        <>
          {canSeeWorkflowNav ? (
            <>
              {renderSidebarSectionLabel({
                label: "Payroll",
                collapsed,
              })}
              {GENERAL_WORKFLOW_ITEMS.map((item) =>
                renderSidebarLink({
                  item,
                  pathname,
                  collapsed,
                  onNavigate: onNavigate,
                }),
              )}
            </>
          ) : null}

          {renderSidebarSectionLabel({
            label: "Requests",
            collapsed,
          })}
          {PAYROLL_MANAGER_REQUEST_ITEMS.map((item) =>
            renderSidebarLink({
              item,
              pathname,
              collapsed,
              onNavigate: onNavigate,
            }),
          )}
        </>
      ) : null}
    </nav>
  );
}

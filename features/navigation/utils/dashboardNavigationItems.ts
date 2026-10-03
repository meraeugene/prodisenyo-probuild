import { BadgeDollarSign, Calculator, Clock3, FolderKanban, House, LayoutDashboard, Trash2, Truck, Upload, Users, WalletCards } from "lucide-react";
import type { AppRole } from "@/types/database";
import type { SidebarNavigationGroup, SidebarNavigationItem } from "../types";

const GMEA_ITEMS = [
  { href: "/gmea-overview", label: "Dashboard", icon: LayoutDashboard },
  { href: "/gmea-projects", label: "Electronics & Solar", icon: FolderKanban },
  { href: "/gmea-rentals", label: "Rentals", icon: Truck, badgeKey: "gmeaRentalExpenses" },
] as const satisfies readonly SidebarNavigationItem[];

const PRODISENYO_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/payroll-analytics", label: "Payroll", icon: WalletCards, badgeKey: "payrollReports", activePaths: ["/payroll-analytics", "/payroll-approvals", "/payroll-reports", "/payroll-change"] },
  { href: "/overtime-approvals", label: "Overtime Approvals", icon: Clock3, badgeKey: "overtime" },
] as const satisfies readonly SidebarNavigationItem[];

export function getDashboardNavigationGroups(role: AppRole | null): SidebarNavigationGroup[] {
  if (role === "ceo") {
    return [
      { label: "Prodisenyo", items: PRODISENYO_ITEMS },
      { label: "GMEA", items: GMEA_ITEMS },
    ];
  }
  if (role === "admin") {
    return [{ label: "Administration", items: [
      { href: "/add-user", label: "User Management", icon: Users },
      { href: "/reset-data", label: "Reset Data", icon: Trash2 },
    ] }];
  }
  if (role === "gmea") return [{ label: "GMEA", items: GMEA_ITEMS }];
  if (role === "payroll_manager") {
    return [
      { items: [{ href: "/payroll-workspace", label: "Payroll Workspace", icon: WalletCards }] },
      { label: "Requests", items: [{ href: "/request-overtime", label: "Request Overtime", icon: Clock3 }] },
    ];
  }
  if (role === "engineer") {
    return [
      { items: [
        { href: "/overview", label: "Dashboard", icon: LayoutDashboard },
        { href: "/projects", label: "Projects", icon: FolderKanban },
      ] },
      { label: "Planning", items: [{ href: "/cost-estimator", label: "Cost Estimator", icon: Calculator }] },
      { label: "Requests", items: [{ href: "/request-overtime", label: "Request Overtime", icon: Clock3 }] },
    ];
  }
  if (role === "purchaser") {
    return [{ items: [
      { href: "/purchaser-dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/purchasing-approvals", label: "Purchasing", icon: BadgeDollarSign },
    ] }];
  }
  const items: SidebarNavigationItem[] = [{ href: "/home", label: "Home", icon: House }];
  if (role !== "employee") items.push({ href: "/upload-attendance", label: "Upload Attendance", icon: Upload });
  items.push({ href: "/request-overtime", label: "Request Overtime", icon: Clock3 });
  return [{ items }];
}

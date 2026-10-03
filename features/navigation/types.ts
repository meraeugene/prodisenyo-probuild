import type { LucideIcon } from "lucide-react";
import type { AppRole, Database } from "@/types/database";

export type SidebarProfile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "username" | "avatar_path" | "role">;

export type SidebarNotificationCounts = {
  overtime: number;
  payrollReports: number;
  estimateReviews: number;
  gmeaExpenses: number;
  gmeaRentalExpenses: number;
};

export type SidebarNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: keyof SidebarNotificationCounts;
  activePaths?: readonly string[];
};

export type SidebarNavigationGroup = {
  label?: string;
  items: readonly SidebarNavigationItem[];
};

export type SidebarNavigationContext = {
  role: AppRole | null;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
  notificationCounts: SidebarNotificationCounts;
};

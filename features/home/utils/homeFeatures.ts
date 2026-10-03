import type { AppRole } from "@/types/database";

type FeatureCard = {
  href: string;
  title: string;
  description: string;
};

export const ROLE_FEATURES: Record<AppRole, FeatureCard[]> = {
  gmea: [
    {
      href: "/gmea-overview",
      title: "Overview Dashboard",
      description:
        "Review Electronics & Solar and Rentals performance in one place.",
    },
    {
      href: "/gmea-projects",
      title: "Electronics & Solar",
      description:
        "Manage projects, collections, expenses, and profit sharing.",
    },
    {
      href: "/settings",
      title: "Settings",
      description: "Manage your account and password.",
    },
  ],
  admin: [
    {
      href: "/add-user",
      title: "User Management",
      description: "Create, update, and manage application user accounts.",
    },
    {
      href: "/reset-data",
      title: "Reset Data",
      description: "Clear workspace records when a clean setup is needed.",
    },
    {
      href: "/settings",
      title: "Settings",
      description: "Manage account settings and preferences.",
    },
  ],
  ceo: [
    {
      href: "/payroll-analytics",
      title: "Payroll Analytics",
      description: "View payroll analytics, trends, and workforce totals.",
    },
    {
      href: "/projects",
      title: "Projects Portfolio",
      description:
        "High-level overview of all company projects, budgets, and schedules.",
    },
    {
      href: "/projects?section=material-approvals",
      title: "Material Approvals",
      description:
        "Approve or reject material requests submitted by site engineers.",
    },
    {
      href: "/budget-tracker",
      title: "Budget Tracker",
      description: "Track project budget usage and spending status.",
    },
    {
      href: "/payroll-approvals",
      title: "Payroll Approvals",
      description: "Review submitted payroll runs and approval updates.",
    },
    {
      href: "/overtime-approvals",
      title: "Overtime Approvals",
      description: "Approve or reject pending overtime requests.",
    },
    {
      href: "/estimate-approvals",
      title: "Estimate Approvals",
      description:
        "Review project estimate submissions from the Projects workflow.",
    },
  ],
  payroll_manager: [
    {
      href: "/upload-attendance",
      title: "Upload Attendance",
      description: "Upload and prepare site attendance files.",
    },
    {
      href: "/request-overtime",
      title: "Request Overtime",
      description: "Submit overtime requests for team members.",
    },
    {
      href: "/settings",
      title: "Settings",
      description: "Manage account settings and preferences.",
    },
  ],
  purchaser: [
    {
      href: "/purchasing-approvals",
      title: "Purchasing",
      description:
        "Track approved material purchases, suppliers, costs, invoices, and deliveries.",
    },
    {
      href: "/settings",
      title: "Settings",
      description: "Manage account settings and preferences.",
    },
  ],
  engineer: [
    {
      href: "/overview",
      title: "Overview Dashboard",
      description:
        "A comprehensive project overview dashboard featuring status trackers and alerts.",
    },
    {
      href: "/projects",
      title: "Projects Workspace",
      description:
        "Manage tasks, log progress reports, and submit material requests for your assigned projects.",
    },
    {
      href: "/cost-estimator",
      title: "Cost Estimator",
      description: "Prepare project estimates and cost breakdowns.",
    },
  ],
  employee: [
    {
      href: "/request-overtime",
      title: "Request Overtime",
      description: "Send overtime requests to your approver.",
    },
    {
      href: "/settings",
      title: "Settings",
      description: "Manage account settings and preferences.",
    },
  ],
};


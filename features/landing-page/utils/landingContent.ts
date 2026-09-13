import type {
  LandingModule,
  LandingRole,
  LandingWorkflowStep,
} from "@/features/landing-page/types";

export const landingModules: LandingModule[] = [
  {
    title: "Project Management",
    description: "Manage assignments, budgets, schedules, and delivery in one place.",
    icon: "projects",
  },
  {
    title: "BOQ & Cost Estimation",
    description: "Build BOQs, submit estimates, and set approved budgets.",
    icon: "estimate",
  },
  {
    title: "Materials & Procurement",
    description: "Move approved materials from quote to receipt.",
    icon: "procurement",
  },
  {
    title: "Attendance & Payroll",
    description: "Import attendance, calculate payroll, and submit for approval.",
    icon: "payroll",
  },
  {
    title: "Progress Tracking",
    description: "Track project progress with clear review states.",
    icon: "progress",
  },
  {
    title: "Cost Tracking",
    description: "Track project costs against the approved budget.",
    icon: "cost",
  },
];

export const landingWorkflow: LandingWorkflowStep[] = [
  {
    label: "Assign",
    description: "CEO assigns the project.",
    icon: "assign",
  },
  {
    label: "Estimate",
    description: "Engineer prepares the BOQ.",
    icon: "estimate",
  },
  {
    label: "Approve",
    description: "CEO approves the estimate.",
    icon: "approve",
  },
  {
    label: "Procure",
    description: "Purchaser orders materials.",
    icon: "procurement",
  },
  {
    label: "Build",
    description: "Teams track work, costs, and payroll.",
    icon: "build",
  },
  {
    label: "Close",
    description: "Management closes the project.",
    icon: "close",
  },
];

export const landingRoles: LandingRole[] = [
  {
    title: "CEO",
    description: "Review projects, approvals, budgets, and progress.",
    icon: "ceo",
  },
  {
    title: "Engineer / Project Manager",
    description: "Prepare estimates, request materials, and track progress.",
    icon: "engineer",
  },
  {
    title: "Purchaser",
    description: "Manage quotes, orders, deliveries, and receipts.",
    icon: "purchaser",
  },
  {
    title: "Payroll Manager",
    description: "Process attendance, overtime, and payroll submissions.",
    icon: "admin",
  },
];


import type {
  LandingModule,
  LandingRole,
  LandingTourSlide,
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

export const landingTourSlides: LandingTourSlide[] = [
  {
    label: "Executive view",
    title: "Know every\nproject.",
    description: "Projects, budgets, approvals, and progress.",
    image: "/landing/ceo-dashboard.png",
    imageAlt: "Prodisenyo ProBuild CEO dashboard",
    imageWidth: 1672,
    imageHeight: 941,
  },
  {
    label: "Planning",
    title: "Build clear, reviewable BOQs.",
    description: "Build BOQs and costs for CEO review.",
    image: "/landing/cost-estimator.png",
    imageAlt: "Prodisenyo ProBuild cost estimator",
    imageWidth: 1672,
    imageHeight: 941,
  },
  {
    label: "Project delivery",
    title: "Keep engineers focused on assigned work.",
    description: "Track projects, requests, and alerts.",
    image: "/landing/engineer-dashboard.png",
    imageAlt: "Prodisenyo ProBuild engineer dashboard",
    imageWidth: 1672,
    imageHeight: 941,
  },
  {
    label: "Procurement",
    title: "Move approved materials to delivery.",
    description: "Manage quotes, orders, and receipts.",
    image: "/landing/purchaser-dashboard.png",
    imageAlt: "Prodisenyo ProBuild purchaser dashboard",
    imageWidth: 1672,
    imageHeight: 941,
  },
  {
    label: "Payroll",
    title: "Turn attendance into approved payroll.",
    description: "Review attendance, payroll, and approvals.",
    image: "/landing/payroll-dashboard.png",
    imageAlt: "Prodisenyo ProBuild payroll dashboard",
    imageWidth: 1536,
    imageHeight: 1024,
  },
];

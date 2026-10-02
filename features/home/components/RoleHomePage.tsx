import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { AppRole } from "@/types/database";
import RoleGreetingHero from "@/features/home/components/RoleGreetingHero";
import EmployeeHomePage from "./EmployeeHomePage";

type FeatureCard = {
  href: string;
  title: string;
  description: string;
};

const ROLE_FEATURES: Record<AppRole, FeatureCard[]> = {
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

function getGreetingMessage(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getPhilippineHour() {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      hourCycle: "h23",
      timeZone: "Asia/Manila",
    }).format(new Date()),
  );
}

function getFirstName(fullName: string | null, username: string) {
  const source = (fullName?.trim() || username.trim() || "there").replace(
    /[_-]+/g,
    " ",
  );
  const [first] = source.split(/\s+/);
  return first || "there";
}

function getDateLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila",
  })
    .format(new Date())
    .toUpperCase();
}

function getRoleHints(role: AppRole) {
  if (role === "admin") {
    return [
      "Manage user accounts and platform administration.",
      "Keep administrative tools separate from executive workflows.",
      "Review account access before changing workspace data.",
    ];
  }

  if (role === "ceo") {
    return [
      "Review approvals and reports with a quick daily check.",
      "Track budgets and estimate health across active projects.",
      "Keep company workflows moving without bottlenecks.",
    ];
  }

  if (role === "payroll_manager") {
    return [
      "Process attendance and payroll tasks for today.",
      "Validate records before each payroll run.",
      "Review incoming requests early to avoid delays.",
    ];
  }

  if (role === "engineer") {
    return [
      "Focus on estimates and material planning today.",
      "Track spending before project costs rise too fast.",
      "Submit requests early to keep work on plan.",
    ];
  }

  return [
    "Check overtime and settings for your shift.",
    "Submit overtime requests early for faster approval.",
    "Keep your profile and account settings up to date.",
  ];
}

export default function RoleHomePage({
  role,
  fullName,
  username,
}: {
  role: AppRole;
  fullName: string | null;
  username: string;
}) {
  const firstName = getFirstName(fullName, username);
  const greeting = getGreetingMessage(getPhilippineHour());
  const dateLabel = getDateLabel();
  const roleHints = getRoleHints(role);
  const featureCards = ROLE_FEATURES[role];

  if (role === "employee")
    return <EmployeeHomePage fullName={fullName} username={username} />;

  return (
    <main className="min-h-full space-y-6 bg-white p-4 sm:p-6">
      <RoleGreetingHero
        dateLabel={dateLabel}
        title={`${greeting}, ${firstName}!`}
        messages={roleHints}
      />

      <section>
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-apple-steel">
            Available Features
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-apple-charcoal">
            Start from here
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((card) => {
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[22px] border border-white/80 bg-white/80 p-5 text-teal-950 shadow-[0_16px_42px_rgba(15,23,42,0.07)] backdrop-blur-xl transition-all duration-300  hover:border-teal-100 "
              >
                <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-teal-100/60 blur-2xl transition duration-300 group-hover:bg-teal-100" />

                <div className="relative z-10 flex items-start justify-between gap-3">
                  <p className="text-[20px] font-semibold tracking-[-0.02em] text-teal-950">
                    {card.title}
                  </p>
                </div>

                <p className="relative z-10 mt-4 text-base leading-6 text-teal-800">
                  {card.description}
                </p>

                <div className="relative z-10 mt-2 flex items-center justify-end">
                  <ArrowRight
                    size={16}
                    className="text-teal-700 transition duration-300  group-hover:text-teal-800"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
